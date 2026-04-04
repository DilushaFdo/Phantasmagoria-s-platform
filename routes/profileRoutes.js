const express = require('express');
const router = express.Router();
const authMiddleware = require('../lib/authMiddleware');
const {
    updateBaseProfile,
    addDegree, updateDegree, deleteDegree,
    addCertification, updateCertification, deleteCertification,
    addLicence, updateLicence, deleteLicence,
    addProfessionalCourse, updateProfessionalCourse, deleteProfessionalCourse,
    addEmploymentHistory, updateEmploymentHistory, deleteEmploymentHistory,
    getProfile
} = require('../controllers/profileController');

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get the active user's complete profile with all credentials
 *     description: Returns the user's base profile along with all associated Degrees, Certifications, Licences, Professional Courses, and Employment History.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 */
router.get('/', authMiddleware, getProfile);

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update the user's base profile
 *     description: Creates or updates the user's base profile, including bio, LinkedIn, and photo URL.
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               biography:
 *                 type: string
 *               linkedin_url:
 *                 type: string
 *               profile_image_path:
 *                 type: string
 *                 description: URL to the profile image
 *     responses:
 *       200:
 *         description: Base profile updated successfully
 *       400:
 *         description: Invalid URL format
 */
router.put('/', authMiddleware, updateBaseProfile);

/**
 * @swagger
 * /api/profile/degree:
 *   post:
 *     summary: Add a new degree
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, url]
 *             properties:
 *               title: { type: string }
 *               url: { type: string }
 *               completion_date: { type: string, format: date }
 *     responses:
 *       201:
 *         description: Degree added
 */
router.post('/degree', authMiddleware, addDegree);

/**
 * @swagger
 * /api/profile/degree/{id}:
 *   put:
 *     summary: Update an existing degree
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title: { type: string }
 *               url: { type: string }
 *               completion_date: { type: string, format: date }
 *     responses:
 *       200: { description: Updated }
 *       404: { description: Not found }
 *   delete:
 *     summary: Delete a degree
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     responses:
 *       200: { description: Deleted }
 *       404: { description: Not found }
 */
router.put('/degree/:id', authMiddleware, updateDegree);
router.delete('/degree/:id', authMiddleware, deleteDegree);

/**
 * @swagger
 * /api/profile/certification:
 *   post:
 *     summary: Add a certification
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *         csrfToken: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title, url]
 *             properties:
 *               title: { type: string }
 *               url: { type: string }
 *               completion_date: { type: string, format: date }
 *     responses:
 *       201: { description: Added }
 */
router.post('/certification', authMiddleware, addCertification);

/**
 * @swagger
 * /api/profile/certification/{id}:
 *   put:
 *     summary: Update a certification
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses:
 *       200: { description: Updated }
 *   delete:
 *     summary: Delete a certification
 *     tags: [Profile]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: integer }
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses:
 *       200: { description: Deleted }
 */
router.put('/certification/:id', authMiddleware, updateCertification);
router.delete('/certification/:id', authMiddleware, deleteCertification);

/**
 * @swagger
 * /api/profile/licence:
 *   post:
 *     summary: Add a licence
 *     tags: [Profile]
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses: { 201: { description: Added } }
 */
router.post('/licence', authMiddleware, addLicence);

/**
 * @swagger
 * /api/profile/licence/{id}:
 *   put:
 *     summary: Update a licence
 *     tags: [Profile]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: integer } } ]
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses: { 200: { description: Updated } }
 *   delete:
 *     summary: Delete a licence
 *     tags: [Profile]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: integer } } ]
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses: { 200: { description: Deleted } }
 */
router.put('/licence/:id', authMiddleware, updateLicence);
router.delete('/licence/:id', authMiddleware, deleteLicence);

/**
 * @swagger
 * /api/profile/course:
 *   post:
 *     summary: Add a professional course
 *     tags: [Profile]
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses: { 201: { description: Added } }
 */
router.post('/course', authMiddleware, addProfessionalCourse);

/**
 * @swagger
 * /api/profile/course/{id}:
 *   put:
 *     summary: Update a course
 *     tags: [Profile]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: integer } } ]
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses: { 200: { description: Updated } }
 *   delete:
 *     summary: Delete a course
 *     tags: [Profile]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: integer } } ]
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses: { 200: { description: Deleted } }
 */
router.put('/course/:id', authMiddleware, updateProfessionalCourse);
router.delete('/course/:id', authMiddleware, deleteProfessionalCourse);

/**
 * @swagger
 * /api/profile/employment:
 *   post:
 *     summary: Add employment history
 *     tags: [Profile]
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses: { 201: { description: Added } }
 */
router.post('/employment', authMiddleware, addEmploymentHistory);

/**
 * @swagger
 * /api/profile/employment/{id}:
 *   put:
 *     summary: Update employment history
 *     tags: [Profile]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: integer } } ]
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses: { 200: { description: Updated } }
 *   delete:
 *     summary: Delete employment history
 *     tags: [Profile]
 *     parameters: [ { in: path, name: id, required: true, schema: { type: integer } } ]
 *     security: [ { bearerAuth: [], csrfToken: [] } ]
 *     responses: { 200: { description: Deleted } }
 */
router.put('/employment/:id', authMiddleware, updateEmploymentHistory);
router.delete('/employment/:id', authMiddleware, deleteEmploymentHistory);

module.exports = router;
