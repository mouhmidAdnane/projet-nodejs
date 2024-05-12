var express = require('express');
var router = express.Router();

router.get("/:take/:skip", (req,res)=>{
  res.send(`get ${req.params.take} users starting from ${req.params.skip}  `)
})
router.get("/:id", (req,res)=>{
  res.send(`user ${req.params.id}`)

})
router.post("/", (req,res)=>{
  res.send("post user")
})
router.patch("/", (req,res)=>{
  res.send("patch user")
  
})
router.delete("/:id", (req,res)=>{
  res.send(`delete user ${req.params.id}`)
})

module.exports = router;
