// Macro to streamlime players who want to roll their own initiative dice

// get currently selected tokens
let targets = canvas.tokens.controlled
if (targets.length < 1){
    popup('Error','Error: No token sleceted',"I am sorry macro Sempai")
} else if (!game.combat && !game.user.isGM){ // only GM can make combats
    popup('Error','Error: No combat in progress',"I am sorry macro Sempai")
} else {
    init_dialog(targets)
}

// general popup class *salutes*
function popup(title,textDisplay,button){
    let temp = Dialog.prompt({
        title: `${title}`,
    	content: `<h2>${textDisplay}</h2>`,
    	callback: () => null,
    	label: button
    })
}

// prompt user for rolls
function init_dialog(targets){
    // put into table for multple users
    var text = `<table>`
    var ids = []
    for (let i=0; i<targets.length; i++){
        let id = `init${i}`
        let target = targets[i]
        let init = null
        ids.push(id)
        // set current value to current initiative if available
        if (target.combatant){
            init = `${target.combatant.initiative}`
        }
        // else get modifier
        if (!init || init == 'null'){
            if (game.settings.get("dnd5e","initiativeDexTiebreaker")){
                init = `+${target.actor.data.data.attributes.init.total}.${target.actor.data.data.abilities.dex.value}`
            } else {
                init = `+${target.actor.data.data.attributes.init.total}.${target.actor.data.data.abilities.dex.value}`
            }
        }
        // build table
        text += `<tr>
                    <td>${targets[i].data.name}</td>
                    <td><input type= "text" id="${id}" name="${id}" value="${init}"/></td>
                </tr>`
        
    }
    text += `</table>`
    
    // and put it all together in a box
    new Dialog({
    	title: `Manual Initiative`,
    	content: `<form>
    			    <div style="display: margin-bottom: 10px">
        			    <h2 style="padding-right: 25px"> Set Manual Initiative </h2>
        			    ${text}
    			    </div>
    		    </form>`,
    	buttons: {
    		yes: {
    			icon: "<i class='fas fa-check'></i>",
                label: `Set`,
                callback: async (html) => set_init(targets,html,ids)
    		},
    		no: {
    			icon: "<i class='fas fa-times'></i>",
    			label: `Cancel`
    		},
    	},
    	default: "yes"
    }).render(true)
}

// i've been given initives, what now?
async function set_init(targets,html,ids){
    let text = '<u>Set initiative of:</u><br>'
    let changes = false
    // check each target for new values
    for (let i=0; i<targets.length; i++){
        let target = targets[i]
        // get value from html
        let init = html.find(`#${ids[i]}`).val()
        if (init[0] == '+'){
            init = null
        } else {
            init = math.round(math.evaluate(init),2)
        }
        // if there is a new value
        if (init != null){
            // add combat if neccesary
            if (!game.combat){
                await Combat.create({
                    scene: canvas.scene.id,
                    active: true
                });
            }
            // add combatant if necessary
            if (!target.inCombat){
                Combatant.create({
                    tokenId: target.id,
                    initiative: init
                },{parent:game.combat})
                changes = true
                text += `${target.name} to ${init}<br>`
            // change initiative
            } else if (math.abs(target.combatant.initiative-init)>0.01) {
                game.combat.setInitiative(target.combatant.id,init)
                changes = true
                text += `${target.name} to ${init}<br>`
            }
        }
    }
    // print if user made changes
    if (changes){
        ChatMessage.create({
            user: game.user._id,
            content: `${text.slice(0,-1)}`
        })
    }
}