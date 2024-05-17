var express = require('express');
var router = express.Router();
const {PrismaClient}= require("@prisma/client")

const prisma= new PrismaClient

router.get("/:take/:skip", async(req,res)=>{
    const take = parseInt(req.params.take); 
    const skip = parseInt(req.params.skip); 

    try {
        const utilisateurs = await prisma.utilisateur.findMany({
            take: take,
            skip: skip,
        });
        res.status(200).json(utilisateurs);
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
    const user = await prisma.utilisateur.findUnique({
      where: { id: parseInt(id) },
    });

    if(!user)
      return res.status(404).json({error: "user not found"})

    return res.status(200).json(user);
  }catch(error){
    console.log(error.message)
    return res.status(500).json({error: "Internal server error"})
  }

})
router.post("/", async (req,res)=>{
  const { email, nom, password, role } = req.body;

  if(!email || !nom || !password || !role)
    return res.status(400).json({error: "invalid data"})
  const userExists = await prisma.utilisateur.findUnique({
    where: { email:  email},
    select: { email: true },
});

  if(userExists)
    return res.status(400).json({error: "user already exists"})

  const validRoles= ["ADMIN", "AUTHOR"]
  if(!validRoles.includes(role))
    return res.status(400).json({error: "invalid role"})
  try{

    const user= {
      email: email,
      nom: nom,
      password: password,
      role: role
    }

    const userCreated= await prisma.utilisateur.create({data: user})
    if(!userCreated)
      return res.status(500).json({error: "Internal server error"})
    return res.status(200).json({message: "user created successfully",user: userCreated})

  }catch(error){
    console.log(error.message)
    return res.status(500).json({error: "Internal server error"})
  }
})


router.patch("/", async (req,res)=>{
  const data= req.body
  const userId= parseInt(data.id)


  if (!userId || isNaN(userId)) 
    return res.status(400).json({error: "invalid id"});

  const userExists = await prisma.utilisateur.findUnique({
    where: { id: userId },
    select: { id: true },
  })

  if(!userExists)
    return res.status(400).json({error: "user not found"});

  if(!["AUTHOR", "ADMIN"].includes(data.role))
    return res.status(400).json({error: "invalid role"});

  const user= await prisma.utilisateur.findUnique({
    where: { email: data.email },
    select: { id: true}
  })

  if(user)
    return res.status(400).send("this email has already been chosen");

  const userUpdate= {
    nom: data.nom ? data.nom : undefined,
    email: data.nom ? data.email : undefined,
    password: data.nom ? data.password : undefined,
    role: data.role ? data.role : undefined,
  }


try {
    
    const userUpdated= await prisma.utilisateur.update({
      where: { id: userId },
      data: userUpdate
    });
    res.status(200).json({message:"user updated successfully", user: userUpdated});
  } catch (error) {
    console.error("Error fetching item:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
  
})
router.delete("/:id", async (req, res) => {
  const userId = req.params.id;

  if (!userId || isNaN(userId)) {
    return res.status(400).json({ error: "invalid id" });
  }

  try {
    const userExists = await prisma.utilisateur.findUnique({
      where: { id: parseInt(userId) },
      select: { email: true }
    });

    if (!userExists) {
      return res.status(400).json({ error: "user not found" });
    }

    await prisma.$transaction(async (prisma) => {
      
      const articles = await prisma.article.findMany({
        where: { userId: parseInt(userId) },
        select: { id: true }
      });

      const articleIds = articles.map(article => article.id);

      await prisma.commentaire.deleteMany({
        where: { articleId: { in: articleIds } }
      });
      await prisma.commentaire.deleteMany({
        where: { email: userExists.email }
      });

      await prisma.article.deleteMany({
        where: { userId: parseInt(userId) }
      });

      await prisma.utilisateur.delete({
        where: { id: parseInt(userId) }
      });
    });

    res.status(200).json({ message: "user deleted successfully" });
  } catch (error) {
    console.error("Error fetching item:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;


