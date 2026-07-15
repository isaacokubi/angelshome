const multer = require("multer");
const path = require("path");
const { v4: uuid } = require("uuid");

function storage(folder){

    return multer.diskStorage({

        destination:function(req,file,cb){

            cb(null,`uploads/${folder}`);

        },

        filename:function(req,file,cb){

            const extension =
            path.extname(file.originalname);

            cb(
                null,
                uuid()+extension
            );

        }

    });

}

module.exports={

    heroUpload:
        multer({storage:storage("hero")}),

    galleryUpload:
        multer({storage:storage("gallery")}),

    staffUpload:
        multer({storage:storage("staff")}),

    logoUpload:
        multer({storage:storage("logo")})

};