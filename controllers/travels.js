const Travel = require('../models/Travel')

//list all travles for user
const getAllTravels = async(req,res)=>{
    try {
        const travels = await Travel.find({createdBy:req.user._id})
        res.render('travels',{travels})
    } catch (error) {
        console.error(error);
        req.flash("error", "Failed to fetch travels");
        res.redirect("/");
    }
}
// Render form for adding
const showCreateForm = (req, res) => {
    res.render("travel", { travel: null }); 
};

const showEditForm = async (req,res)=>{
    try {
        const travelId = req.params.id;
        const userId = req.user._id;

        const travel = await Travel.findById({
            _id :travelId,
            createdBy:userId
        })
        if (!travel) {
            req.flash("error", "Travel record not found or unauthorized");
            return res.redirect("/travels");
        }
        res.render('travel',{travel})
    } catch (error) {
        console.error(error);
        req.flash("error", "Error loading edit form");
        res.redirect("/travels");
    }
}

const createTravel= async(req,res)=>{
    try {
        const{placeName,location,visitDate}= req.body;
        const newTravel = new Travel({
            placeName,
            location,
            visitDate,
            createdBy:req.user._id
        })
        await newTravel.save()
        req.flash("success", "Travel added successfully");
        res.redirect("/travels");
    } catch (error) {
        console.error(error);
        const errors = parseValidationErrs(error);
        req.flash("error", errors);
        res.redirect("/travels");
    }
}
const updateTravel = async(req,res)=>{
    try {
        const{placeName,location,visitDate} = req.body
        const travelId= req.params.id
        const userId = req.user._id

        const updatedTravel = await Travel.findByIdAndUpdate({
            _id:travelId,
            createdBy: userId
        },req.body,{
            new:true,
            runValidators: true
        })
        if (!updatedTravel) {
            req.flash("error", "Travel record not found or unauthorized");
            return res.redirect("/travels");
        }

        req.flash("success", "Travel updated successfully");
        res.redirect("/travels");
    } catch (error) {
        console.error(error);
        const errors = parseValidationErrs(error);
        req.flash("error", errors);
        res.redirect("/travels");
    }
}

const deleteTravel = async (req,res)=>{
    try {
        const travelId = req.params.id;
        const userId = req.user._id;

        const deletedTravel = await Travel.findByIdAndDelete({
            _id :travelId,
            createdBy:userId
        });

        if (!deletedTravel) {
            req.flash("error", "Travel record not found or unauthorized");
            return res.redirect("/travels");
        }
        res.redirect('/travels')
       
    } catch (error) {
        console.error(error);
        req.flash("error", "Error deleting travel");
        res.redirect("/travels");
    }
}

module.exports={
    getAllTravels,
    showCreateForm,
    showEditForm,
    createTravel,
    updateTravel,
    deleteTravel
}