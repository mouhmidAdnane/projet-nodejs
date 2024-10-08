const express= require("express")
router= express.Router()
const {PrismaClient}= require("@prisma/client")

const prisma= new PrismaClient

router.get("/:take/:skip", async(req,res)=>{
    const take = parseInt(req.params.take); 
    const skip = parseInt(req.params.skip); 

    try{
      const categories= await prisma.categorie.findMany({
        include: {
            _count: {
                select: { articles: true },
            },
        },
      })

      if(!categories)
          return res.status(404).json({error: "categories not found"})

      categories.map((category)=>{
          category._count = category._count.articles
      })
      return res.status(200).json(categories);
    } catch (error) {
        console.error("Error fetching items:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
})


router.get("/:id", async (req,res)=>{
  const id= req.params.id
  if (!id)          return res.status(400).json({ error: "Missing id" });
  if (isNaN(id))    return res.status(400).json({ error: "invalid id" });
  
  try{
    const categorie = await prisma.categorie.findUnique({
      where: { id: parseInt(id) },
    });

    if(!categorie)
      return res.status(404).json({error: "category not found"})

    return res.status(200).json(categorie);
  }catch(error){
    console.log(error.message)
    return res.status(500).json({error: "Internal server error"})
  }

})
router.post("/", async (req,res)=>{
  const  nom  = req.body.nom;

  if(!nom)
    return res.status(400).json({error: "invalid data"})

  try{
    const categorieCreated= await prisma.categorie.create({data: {nom: nom}})
    return res.status(200).json({message: "category created successfully",categorie: categorieCreated})

  }catch(error){
    console.log(error.message)
    return res.status(500).json({error: "Internal server error"})
  }
})


router.patch("/", async (req,res)=>{
  const nom= req.body.nom
  const categorieId= req.body.id

  console.log(req.body)


  if (!categorieId) return res.status(400).json({ error: "Missing id" });
  if (isNaN(categorieId)) return res.status(400).json({ error: "Invalid id" });

  const categorieExists = await prisma.categorie.count({
    where: { id: parseInt(categorieId) }
  })
  
  if(categorieExists === 0)
    return res.status(400).json({error: "category not found"});

try {
    const categorieUpdated= await prisma.categorie.update({
      where: { id: parseInt(categorieId) },
      data: {nom: nom}
    });
    res.status(200).json({message:"category updated successfully", categorie: categorieUpdated});
  } catch (error) {
    console.error("Error fetching item:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
  
})
router.delete("/:id", async (req, res) => {
  const categorieId = req.params.id;

  if (!categorieId || isNaN(categorieId)) {
    return res.status(400).json({ error: "invalid id" });
  }

  const categoryExists = await prisma.categorie.count({ where: {
    id: categorieId
  } });

  if (categoryExists === 0) 
    return res.status(400).json({ error: "category not found" });
  try {
      await prisma.categorie.delete({
        where: { id: parseInt(categorieId) }
      });
    res.status(200).json({ message: "category deleted successfully" });
  } catch (error) {
    console.error("Error fetching item:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});


module.exports = router;