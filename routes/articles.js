const express= require("express")
router= express.Router()

router.get("/:take/:skip", (req,res)=>{
    res.send(`get ${req.params.take} articles starting from ${req.params.skip}  `)
})
router.get("/:id", (req,res)=>{
    res.send(`article ${req.params.id}`)

})
router.post("/", (req,res)=>{
    res.send("post article")
})
router.patch("/", (req,res)=>{
    res.send("patch article")
    
})
router.delete("/:id", (req,res)=>{
    res.send(`delete article ${req.params.id}`)
})

module.exports = router;
