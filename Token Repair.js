// options
let always_replace = false
let attempt_actor = true

// check if file exists
async function file_exists(file){
    return (await fetch(file)).status == 200
}

// wrap to remove error
(async () => {
    
    // iterate over all selected tokens
    for (let token of canvas.tokens.controlled){
        
        // if there is a broken file, get actor
        let img = token.data.img
        if (token.actor && (always_replace || await !file_exists(img))){
            let actor = game.actors.get(token.actor.data._id)
            
            // check the prototype token for an image
            img = actor.data.token.img
            if (await !file_exists(img)){
                if (!attempt_actor) {
                    console.log(`Error fixing image for ${token.name}: Prototype token image does not exist`)
                    continue
                } else {
                    
                    // check actor for image
                    img = actor.img
                    if (await !file_exists(img)) {
                        console.log(`Error fixing image for ${token.name}: Actor image does not exist`)
                        continue
                    }
                }
            }
            
            // save update
            console.log(`Fixed image for ${token.name}`)
            token.document.update({img:img})
        }
    }
    
})();