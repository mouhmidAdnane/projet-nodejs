const express= require("express")
const router= express.Router()
const {PrismaClient}= require("@prisma/client")
const multer  = require('multer');
const path = require('path');
const fs= require("fs")

const prisma= new PrismaClient()

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'public/images');
    },
    filename: function (req, file, cb) {
      cb(null, `${Date.now()}-${file.originalname}`);
    }
  });
  const upload = multer({ storage: storage });



  const deleteImage = (imagePath) => {
    return new Promise((resolve, reject) => {
        fs.unlink(imagePath, (err) => {
            if (err) {
                //i don't want the execution to stop if there is an error while deleting the image
                resolve("Error while deleting image");
            } else {
                resolve("Image deleted successfully");
            }
        });
    });
};

  


router.get("/:take/:skip", async(req,res)=>{
    
    const take = parseInt(req.params.take); 
    const skip = parseInt(req.params.skip);
    const category = req.query.categorie || null;

    let filter = { published: true };
    if (category) {
        filter = {
            categories: {
                some: {
                    nom: category
                }
            }
        };
    }

    // try {
        const articles = await prisma.article.findMany({
            take: take,
            skip: skip,
            select: {
                id: true,
                titre: true,
                image: true,
                categories: {
                    select: {nom: true}
                },
                auteur: {
                    select: {nom: true}
                }
            },
            where: filter,
        });

        if(articles.length === 0)
            return(res.status(404).json({error: "there are no published articles here"}))

        const totalArticles = await prisma.article.count({ where: filter });

        const transformedArticles = articles.map(article => ({
            ...article,
            categories: article.categories.map(category => category.nom) //categories
        }));

        res.status(200).json({
            articles: transformedArticles,
            currentPage: Math.ceil(skip / 10)+1,
            totalPages: Math.ceil(totalArticles / 10),
            currentCategory: category,
        });
    }
    //  catch (error) {
    //     console.error("Error fetching items:", error.message);
    //     res.status(500).json({ error: "Internal server error" });
    // }
// }
)

router.get("/:id", async (req,res)=>{
    const id = req.params.id;
    if (!id)    return res.status(400).json({ error: "Missing id" });
    if (isNaN(id))    return res.status(400).json({ error: "invalid id" });

        const article = await prisma.article.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true,
                titre: true,
                contenu: true,
                // published: true,
                image: true,
                categories: {
                    select: {
                        id: true,
                        nom: true
                    }
                },
                commentaires: {
                    select: {
                        id: true,
                        contenu: true,
                        email: true
                    }
                },
                auteur: {
                    select: {
                        id: true,
                        nom: true,
                        email: true
                    }
                }
            }
        });

        if (!article) 
            return res.status(404).json({ error: "Article not found" });

        res.status(200).json({message: "success", article:article});
    }
)


router.post("/", upload.single('image'),async (req,res)=>{

    const { titre, contenu, userId } = req.body;
    if (!titre || !contenu || !userId)
        return res.status(400).json({ error: 'Missing required fields (titre, contenu, userId)' });

    const user= await prisma.utilisateur.findUnique({
            where: {
                id: parseInt(userId)
            },
            select: {
                role: true
            }
        })
        
        if(!user)
            return res.status(400).json({ error: 'Invalid user' });
        if(user.role !== "AUTHOR")
            return res.status(400).json({ error: 'Only authors can create articles' });
        
        const imageUrl = req.file ? `images/${req.file.filename}` : null;
        const published = req.body.published === true ? true : false;
        const categories = req.body.categories ? req.body.categories : [];
        
        if(categories.length !== 0){
            const categoriesExist = await prisma.categorie.findMany({
                where: {
                    id: {in: categories}
                }
            })
            if(categoriesExist.length !== categories.length)
                return res.status(400).json({ error: 'Invalid categories' });
        }
        
        
    try {
        const article = await prisma.article.create({
            data: {
                titre,
                contenu,
                published,
                userId: parseInt(userId),
                image: imageUrl,
                categories: {
                    connect: categories.map(category => ({ id: parseInt(category) }))
                }
            }
        });

        res.status(200).json(article);
    } catch (error) {
        console.error("Error creating item:", error.message);
        res.status(500).json({ error: "Internal server error", error });
    }
})


router.patch("/", upload.single('image'), async (req, res) => {

    const data = req.body;
    data.id = parseInt(data.id);

    if (!data.id) 
        return res.status(400).send("Missing id");

    
    
        const originalArticle = await prisma.article.findUnique({
            where: { id: data.id },
            select: { image: true, categories: { select: { id: true } } }
        });

        if (!originalArticle) 
            return res.status(404).send("Article not found");
        

        

        const categoryIds = data.categories ? data.categories.map(id => ({ id: parseInt(id, 10) })) : [];

        if(categoryIds.length !== 0){
            const categoriesExist = await prisma.categorie.findMany({
                where: {
                    id: {in: categoryIds.map(category => category.id)}
                }
            })
            if(categoriesExist.length !== categoryIds.length)
                return res.status(400).json({ error: 'Invalid categories' });
        }

        
        try {

            if (req.file) {
                var newImageUrl;
                if (originalArticle.image)
                    await deleteImage(`public/${originalArticle.image}`);

                newImageUrl = `images/${req.file.filename}`;
            }
        const updatedArticle = await prisma.$transaction(async (prisma) => {
            const article = await prisma.article.update({
                where: { id: data.id },
                data: {
                    titre: data.titre || undefined,
                    contenu: data.contenu || undefined,
                    published: data.published !== undefined ? data.published : undefined,
                    image: newImageUrl || undefined,
                }
            });

            await prisma.article.update({
                where: { id: data.id },
                data: {
                    categories: {
                        set: categoryIds
                    }
                }
            });
            return article;
        });

        res.status(200).json({ message: "Article updated successfully", article: updatedArticle });
    } catch (error) {
        console.error("Error updating item:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});


router.delete("/:id", async (req, res) => {
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id" });
    if (isNaN(id))    return res.status(400).json({ error: "invalid id" });


    
        const article = await prisma.article.findUnique({
            where: { id: parseInt(id) },
            select: { image: true },
        });

        if (!article) 
            return res.status(404).json({ error: "Article not found" });
        

    try {        
        await prisma.$transaction(async (prisma) => {
            if (article.image) {
                const imagePath = path.join(__dirname, "..", "public", article.image);
                await deleteImage(imagePath);
            }
            
            await prisma.commentaire.deleteMany({
                where: { articleId: parseInt(id) }
            });

            await prisma.article.delete({
                where: { id: parseInt(id) }
            });
        });

        res.status(200).json({ message: "Article deleted successfully" });
    } catch (error) {
        console.error("Error deleting article:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;


