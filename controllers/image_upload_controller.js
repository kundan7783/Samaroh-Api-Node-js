const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination : (req,file,cb)=>{
        cb(null,'./uploades_images')
    },
    filename : (req,file,cb) =>{
        const newImageName = Date.now() + path.extname(file.originalname);
        cb(null,newImageName)
    }
});

const  limits = {
    fieldSize : 1024 * 1024 * 1,
}
const fileFilter = (req,file,cb)=>{
    if(file.mimetype.startsWith('image/')){
        cb(null,true);
    }else{
        cb(new Error('Only Image are allowed!'), false)
    }
}
const upload = multer({
    storage : storage,
    fileFilter : fileFilter,
    limits : limits
})

module.exports = upload;

