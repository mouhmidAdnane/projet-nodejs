const express= require("express")
router= express.Router();

const {PrismaClient}= require("@prisma/client")

const prisma= new PrismaClient

router.get("/:take/:skip", async(req,res)=>{
    const take = parseInt(req.params.take); 
    const skip = parseInt(req.params.skip); 

    try {
        const commentaires = await prisma.commentaire.findMany({
            take: take,
            skip: skip,
        });
        return res.status(200).json(commentaires);
    } catch (error) {
        console.error("Error fetching items:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
})
router.get("/:id", async (req,res)=>{
  const id= req.params.id
  if(!id || isNaN(id) )
    return res.status(400).json({error: "invalid id"})
  
  
  try{
    const commentaire = await prisma.commentaire.findUnique({
      where: { id: parseInt(id) },
    });

    if(!commentaire)
      return res.status(404).json({error: "commentaire not found"})

    return res.status(200).json(commentaire);
  }catch(error){
    console.log(error.message)
    return res.status(500).json({error: "Internal server error"})
  }

})


router.post("/", async (req,res)=>{

  const {email, contenu, articleId} = req.body;
  if(!email || !contenu || !articleId)
    return res.status(400).json({error: "invalid data"})

  userExists = await prisma.utilisateur.findUnique({
      where: { email: email },
      select: { id: true },
  })
  if(!userExists)
    return res.status(400).json({error: "user not found"})

  try{
    const comment= {
        email: email,
        contenu: contenu,
        articleId: articleId
    }
    const commentaireCreated= await prisma.commentaire.create({data: comment})
    if(!commentaireCreated)
      return res.status(500).json({error: "Internal server error"})
    return res.status(200).json({message: "commentaire created successfully",commentaire: commentaireCreated})

  }catch(error){
    console.log(error.message)
    return res.status(500).json({error: "Internal server error"})
  }
})


router.patch("/", async (req,res)=>{
  const data= req.body.contenu
  const commentaireId= parseInt(req.body.id)
  if (!commentaireId || isNaN(commentaireId)) 
    return res.status(400).json({error: "invalid id"});

  if(!data)
    return res.status(400).json({error: "invalid data"})



try {
    const commentaireUpdated= await prisma.commentaire.update({
      where: { id: commentaireId },
      data: {contenu: data}
    });
    res.status(200).json({message:"commentaire updated successfully", commentaire: commentaireUpdated});
  } catch (error) {
    console.error("Error fetching item:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
  
})
router.delete("/:id", async (req, res) => {
  const commentaireId = req.params.id;

  if (!commentaireId || isNaN(commentaireId)) {
    return res.status(400).json({ error: "invalid id" });
  }

  try {
      await prisma.commentaire.delete({
        where: { id: parseInt(commentaireId) }
      });
    res.status(200).json({ message: "commentaire deleted successfully" });
  } catch (error) {
    console.error("Error fetching item:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;