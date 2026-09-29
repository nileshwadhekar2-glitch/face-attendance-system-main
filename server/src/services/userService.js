const pool = require('../config/database');
const cloudinary = require('../config/cloudinary');
const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const sharp = require('sharp');

const registerUser = async (user) => {
    let { name, matric_no, level, department, course, photo, descriptor, section, classIds } = user;
    
    // Enforce BLOCK LETTERS as per system requirements
    name = (name || '').toUpperCase();
    // Compress and store the enrollment photo using the configured provider.
    if (photo && photo.startsWith('data:image')) {
        try {
            if (process.env.PHOTO_STORAGE === 'local') {
                const filename = `${randomUUID()}.jpg`;
                const directory = path.join(__dirname, '../../uploads');
                await fs.mkdir(directory, { recursive: true });
                await sharp(Buffer.from(photo.split(',')[1], 'base64'))
                    .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 80 }).toFile(path.join(directory, filename));
                photo = `/uploads/${filename}`;
            } else if (process.env.PHOTO_STORAGE === 'database') {
                const image = await sharp(Buffer.from(photo.split(',')[1], 'base64'))
                    .resize(320, 320, { fit: 'inside', withoutEnlargement: true })
                    .jpeg({ quality: 75 }).toBuffer();
                photo = `data:image/jpeg;base64,${image.toString('base64')}`;
            } else {
            const uploadResponse = await cloudinary.uploader.upload(photo, {
                folder: 'student_faces',
                resource_type: 'image'
            });
            photo = uploadResponse.secure_url;
            }
        } catch (err) {
            console.error("Photo storage failed:", err);
            throw new Error(`Failed to upload student image: ${err.message}`);
        }
    }

    // Check if user already exists by matric_no
    const { rows: existingUsers } = await pool.query('SELECT id, descriptor FROM users WHERE matric_no = $1', [matric_no]);
    const existingUser = existingUsers[0];

    if (existingUser) {
        throw new Error("Student already enrolled. Please contact the lecturer to update your profile.");
    }
    
    // New user: store as array of arrays. 
    // If descriptor is already an array of arrays (from multi-upload), use it.
    // If it's a single descriptor array, wrap it.
    const initialDescriptors = (Array.isArray(descriptor) && Array.isArray(descriptor[0])) ? descriptor : [descriptor];

    const { rows } = await pool.query(
        'INSERT INTO users (name, matric_no, level, department, course, photo, descriptor, section) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
        [name, matric_no, level, department, course, photo, JSON.stringify(initialDescriptors), section]
    );
    const userId = rows[0].id;

    // Handle Class Enrollment
    if (classIds && Array.isArray(classIds)) {
        for (const cId of classIds) {
            try {
                await pool.query('INSERT INTO enrollments (user_id, class_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, cId]);
            } catch (e) { /* ignore */ }
        }
    }

    return { userId, created: !existingUser };
};

const getAllUsers = async (search, sort, page = 1, limit = 10) => {
    let query = `
        SELECT u.id, u.name, u.matric_no, u.level, u.department, u.course, u.photo, u.descriptor, u.section, u.is_active,
        to_char(u.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
        STRING_AGG(c.code, ', ') as enrolled_classes
        FROM users u
        LEFT JOIN enrollments e ON u.id = e.user_id
        LEFT JOIN classes c ON e.class_id = c.id
        WHERE u.is_active = 1
    `;
    let countQuery = `SELECT COUNT(DISTINCT u.id) as total FROM users u WHERE u.is_active = 1`;
    const params = [];
    let paramIndex = 1;

    if (search) {
        const searchClause = ` AND (u.name ILIKE $${paramIndex} OR u.matric_no ILIKE $${paramIndex + 1})`;
        query += searchClause;
        countQuery += searchClause;
        params.push(`%${search}%`, `%${search}%`);
        paramIndex += 2;
    }

    query += ' GROUP BY u.id';

    if (sort === 'matric') {
        query += ' ORDER BY u.matric_no ASC';
    } else if (sort === 'name') {
        query += ' ORDER BY u.name ASC';
    } else {
        query += ' ORDER BY u.created_at DESC';
    }

    // Pagination
    const offset = (page - 1) * limit;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    
    const dataParams = [...params, limit, offset];

    const { rows: data } = await pool.query(query, dataParams);
    const { rows: countResult } = await pool.query(countQuery, params);

    return {
        data,
        total: countResult.length > 0 ? parseInt(countResult[0].total, 10) : 0
    };
};

const deleteUser = async (id) => {
    // Perform Hard Delete to prevent overcrowding and allow zero-friction re-enrollment
    await pool.query('DELETE FROM enrollments WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM attendance WHERE user_id = $1', [id]);
    await pool.query('DELETE FROM users WHERE id = $1', [id]);
};

module.exports = {
    registerUser,
    getAllUsers,
    deleteUser
};
