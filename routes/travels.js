const express = require('express')
const router = express.Router()
const {
    getAllTravels,
    showCreateForm,
    showEditForm,
    createTravel,
    updateTravel,
    deleteTravel
} = require('../controllers/travels')


router.get('/',getAllTravels)
router.get('/add',showCreateForm)
router.get('/edit/:id',showEditForm)

router.post('/',createTravel)
router.post('/update/:id',updateTravel)
router.post('/delete/:id',deleteTravel)


module.exports =router