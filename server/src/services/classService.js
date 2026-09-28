const pool = require('../config/database');

const createClass = async (name, code, department) => {
    try {
        const { rows } = await pool.query(
            'INSERT INTO classes (name, code, department) VALUES ($1, $2, $3) RETURNING id',
            [name, code, department]
        );
        return { id: rows[0].id, name, code, department };
    } catch (error) {
        if (error.code === '23505') { // Postgres unique_violation code
            throw new Error('Class code already exists.');
        }
        throw error;
    }
};

const getAllClasses = async () => {
    const query = `
        SELECT c.id, c.name, c.code, c.department, COUNT(e.user_id) as enrolled_count
        FROM classes c
        LEFT JOIN enrollments e ON c.id = e.class_id
        GROUP BY c.id
        ORDER BY c.code ASC
    `;
    const { rows } = await pool.query(query);
    return rows;
};

const deleteClass = async (id) => {
    await pool.query('DELETE FROM classes WHERE id = $1', [id]);
};

const getClassById = async (id) => {
    const { rows } = await pool.query('SELECT * FROM classes WHERE id = $1', [id]);
    return rows[0];
};

module.exports = {
    createClass,
    getAllClasses,
    deleteClass,
    getClassById
};
