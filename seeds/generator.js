const { PrismaClient } = require('@prisma/client');
const { faker } = require('@faker-js/faker');
const prisma= new PrismaClient()


const findItems= async (item)=>{
    switch (item){
        case "users":
            const users= await prisma.utilisateur.findMany({
                where: {role :"AUTHOR"},
                select: {
                    id: true,
                    email: true}
            })
            return users
        case "articles":
            const articles= await prisma.article.findMany({
                select: {id: true}
            })
            return articles
        case "categories":
            const categories= await prisma.categorie.findMany({
                select: {id: true}
            })
            return categories
            
        default:
            throw new Error("findItems: invalid item")
    }
}

function getRandom(array,numberOfElements) {

    let newArray= [...array]
    let result= []
    if (newArray.length === 0) 
      throw new Error("passed an empty array");

    for(let i=0 ;i<numberOfElements;i++){
        const randomIndex = Math.floor(Math.random() * newArray.length);
        const randomElement = newArray[randomIndex];
        result.push(randomElement)
        newArray.splice(randomIndex, 1);

    }
    return result;
  }

const generateUser= (role)=>{
    if(!role || !["AUTHOR", "ADMIN"].includes(role))
        throw new Error("invalid role")
  const user = {
    email: faker.internet.email(),
    nom: faker.person.fullName(),
    password: "123",
    role: role,
  };
  return user
}

const generateCategorie= ()=>{
    const categorie= {nom: faker.lorem.word()}
    return categorie
}

const generateArticle= (users, categories)=>{
    if(users.length===0)
        throw new Error("there are no authors")
    
    const authorIndex= Math.floor(Math.random() * users.length)
    const articleCategories= getRandom(categories,4)
    const article= {
        titre: faker.lorem.words(),
        contenu: faker.lorem.paragraph(),
        image: null,
        published: true,
        userId: users[authorIndex].id,
        categories: {
            connect:articleCategories
        }
    }

    return article
}
const generateComment= (users)=>{
    if(users.length === 0)
        throw new Error("there are no users")
    
    const userIndex= faker.number.int({min:0, max: users.length-1})
    const comment={
        email: users[userIndex].email,
        contenu: faker.lorem.lines(2)
    }
    return comment
}

module.exports = {findItems, generateUser, generateCategorie, generateArticle, generateComment,getRandom};