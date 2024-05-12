const express= require("express")
router= express.Router()

router.get("/:take/:skip", async(req,res)=>{
    res.send(`get ${req.params.take} categories starting from ${req.params.skip}  `)
   
})
router.get("/:id", (req,res)=>{
    res.send(`categorie ${req.params.id}`)

})
router.post("/", (req,res)=>{
    res.send("post categorie")
})
router.patch("/", (req,res)=>{
    res.send("patch categorie")
    
})
router.delete("/:id", (req,res)=>{
    res.send(`delete categorie ${req.params.id}`)
})

module.exports = router;