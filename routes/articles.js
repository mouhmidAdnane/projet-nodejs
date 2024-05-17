const express= require("express")
router= express.Router()
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
                console.error("Error while deleting image:", err.message);
                reject(new Error("Error while deleting image"));
            } else {
                resolve("Image deleted successfully");
            }
        });
    });
};

  


router.get("/:take/:skip", async(req,res)=>{
    const take = parseInt(req.params.take); 
    const skip = parseInt(req.params.skip);

    try {
        const articles = await prisma.article.findMany({
            take: take,
            skip: skip,
            select: {
                id: true,
                titre: true,
                contenu: true,
                image: true,
                categories: {
                    select: {nom: true}
                },
                auteur: {
                    select: {nom: true}
                }
            },
            where: {published: true},
        });

        if(articles.length === 0)
            return(res.status(404).json({error: "there are no published articles"}))

        const transformedArticles = articles.map(article => ({
            ...article,
            categories: article.categories.map(category => category.nom)
        }));

        res.status(200).json(transformedArticles);
    } catch (error) {
        console.error("Error fetching items:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
})




router.get("/:id", async (req,res)=>{
    const id = req.params.id;
    if (!id) return res.status(400).json({ error: "Missing id" });

    try {
        const article = await prisma.article.findUnique({
            where: { id: Number(id) },
            select: {
                id: true,
                titre: true,
                contenu: true,
                published: true,
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

        res.status(200).json(article);
    } catch (error) {
        console.error("Error fetching item:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
    

})
router.post("/", upload.single('image'),async (req,res)=>{

    try {
        const { titre, contenu, userId } = req.body;
        if (!titre || !contenu || !userId)
            return res.status(400).json({ error: 'Missing required fields (titre, contenu, userId)' });

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
        

        const article = await prisma.article.create({
            data: {
                titre,
                contenu,
                published,
                userId: parseInt(userId),
                image: imageUrl,
                categories: {
                    connect: categories.map(category => ({ id: Number(category) }))
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
    data.id = parseInt(data.id, 10);

    if (!data.id) 
        return res.status(400).send("Missing id");
    

    try {
        const originalArticle = await prisma.article.findUnique({
            where: { id: data.id },
            select: { image: true, categories: { select: { id: true } } }
        });

        if (!originalArticle) 
            return res.status(404).send("Article not found");
        

        if (req.file) {
            var newImageUrl;
            if (originalArticle.image) {
                await deleteImage(`public/${originalArticle.image}`);
            }
            newImageUrl = `images/${req.file.filename}`;
        }

        const categoryIds = data.categories ? data.categories.map(id => ({ id: parseInt(id, 10) })) : [];

        console.log(categoryIds)
        if(categoryIds.length !== 0){
            const categoriesExist = await prisma.categorie.findMany({
                where: {
                    id: {in: categoryIds.map(category => category.id)}
                }
            })
            if(categoriesExist.length !== categoryIds.length)
                return res.status(400).json({ error: 'Invalid categories' });
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

    try {
        const article = await prisma.article.findUnique({
            where: { id: Number(id) },
            select: { image: true },
        });

        if (!article) 
            return res.status(404).json({ error: "Article not found" });
        

        
        await prisma.$transaction(async (prisma) => {
            if (article.image) {
                const imagePath = path.join(__dirname, "..", "public", article.image);
                await deleteImage(imagePath);
            }
            
            await prisma.commentaire.deleteMany({
                where: { articleId: parseInt(id, 10) }
            });

            await prisma.article.delete({
                where: { id: parseInt(id, 10) }
            });
        });

        res.status(200).json({ message: "Article deleted successfully" });
    } catch (error) {
        console.error("Error deleting article:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
