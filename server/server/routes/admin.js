const express =
    require("express");


const router =
    express.Router();


const controller =
    require("../controllers/adminController");


const Announcement =
    require("../models/Announcement");


const auth =
    require("../middleware/auth");





// Admin login

router.post(
    "/login",
    controller.login
);



// Admin register

router.post(
    "/register",
    controller.register
);



// Dashboard

router.get(
    "/dashboard",
    auth,
    controller.dashboard
);



// Create announcement

router.post(

    "/announcement",

    auth,

    controller.createAnnouncement

);




// Public announcements

router.get(

    "/announcements",

    async (req, res) => {


        try {


            const announcements =
                await Announcement.find()

                    .sort({

                        date: -1

                    })

                    .limit(5);



            res.json(
                announcements
            );


        }


        catch (error) {


            res.status(500).json({

                message: error.message

            });


        }


    }

);



module.exports =
    router;