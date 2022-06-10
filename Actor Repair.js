// options
let linked_actors = null        // should token be made to be linked (null is don't change)
let always_relink = false       // force actor refresh by token name

let always_push_img = false     // always update prototype token imaage from token
let push_full_token = false     // always update prototype token from token


// function to check if file exists
async function file_exists(file){
    if (file == 'icons/svg/mystery-man.svg') { return false }
    return (await fetch(file)).status == 200
}

// iterate over all selected tokens
(async () => {
    for (let token of canvas.tokens.controlled){
        let actor = token.actor
        
        let token_update = {}
        
        // if the token does not have an actor, search by name
        if (always_relink || !actor){
            actor = game.actors.getName(token.data.name)
            
            // check if actor with name
            if (!actor) {
                console.log(`Error: No actor with name ${token.data.name}`)
            } else {
                token_update['actorId'] = actor.data._id
            }
        }
        
        if (actor) { 
            
            // add actor info
            token_update['actorLink'] = linked_actors
            token.data.document.update(token_update)
            console.log(`Token ${token.name} linked to actor`)
        
            // check if prototpy token needs update
            console.log(actor)
            console.log(token)
            actor = game.actors.get(actor.data._id)
            if (push_full_token){
                actor.data.token.update(token.data) 
                console.log(`Actor ${actor.data.name} token updated from token`)
            } else if (always_push_img || await !file_exists(actor.data.token.img)) {
                let img = token.data.img
                if (await file_exists(img)){
                    actor.data.token.update({img:img})   
                    console.log(`Actor ${actor.data.name} token image updated from token`)
                }  
            }
            
        }
    }
})()