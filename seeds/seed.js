const { PrismaClient } = require('@prisma/client');
const generator= require("./generator")

const prisma= new PrismaClient()


const users =  async()=> await generator.findItems("users");
// const articles = async()=>await generator.findItems("articles");
const categories = async()=>await generator.findItems("categories");

const seedUsers= async(number,role)=>{
    try{
        let usersToPush= []
        for(i=0;i<number;i++){
            const user=generator.generateUser(role)
            usersToPush.push(user)
        }
        await prisma.utilisateur.createMany({data: usersToPush})
    }catch(error){
        console.log("error: ",error.message)
    }
}

const seedCategories= async(number)=>{
    try{
        let categoriesToPush= []
        for(i=0;i<number;i++){
            const categorie= generator.generateCategorie()
            categoriesToPush.push(categorie)
        }
        await prisma.categorie.createMany({data: categoriesToPush})
    }catch(error){
        console.log("server error: ",error.message)
    }
}

const seedArticles = async (number, users, categories) => {
    try {
        const [userData, categorieData] = await Promise.all([users(), categories()]);

        for (let i = 0; i < number; i++) {
            const article = generator.generateArticle(userData, categorieData);
            const createdArticle = await prisma.article.create({ data: article });

            const numComments = Math.floor(Math.random() * 20)+1;
            const commentsToCreate = [];
            for (let j = 0; j < numComments; j++) {
                const comment = generator.generateComment(userData);
                comment["articleId"]= createdArticle.id
                commentsToCreate.push(comment)
            }
            await prisma.commentaire.createMany({data: commentsToCreate}).then(console.log("comments seeded successfully"))
        }
    } catch (error) {
        throw new Error("Error in seedArticles: " + error.message);
    }
}

const seed= ()=>{
    seedUsers(1,"ADMIN")
        seedUsers(10,"AUTHOR").then(()=>{
            seedCategories(10).then(()=>{
                seedArticles(100,users,categories)
            })
        })
}

seed()

