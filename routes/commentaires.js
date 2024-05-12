const express= require("express")
router= express.Router();

router.get("/:take/:skip", (req,res)=>{
    res.send(`get ${req.params.take} commentaires starting from ${req.params.skip}  `)
})
router.get("/:id", (req,res)=>{
    res.send(`commentaire ${req.params.id}`)

})
router.post("/", (req,res)=>{
    res.send("post commentaire")
})
router.patch("/", (req,res)=>{
    res.send("patch commentaire")
    
})
router.delete("/:id", (req,res)=>{
    res.send(`delete commentaire ${req.params.id}`)
})

module.exports = router;