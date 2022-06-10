/*-------------------------------------------------------------------\\
                            Settings
\\-------------------------------------------------------------------*/
const image_path = 'https://assets.forge-vtt.com/5f833aba179d74e7409d8d49/Tarokka/';
// const image_path = '/moulinette/images/custom/Items/Tarokka Cards/';
const comp_name = 'Spirit Bard';
const effect_name = 'Spirit Tale';

/*-------------------------------------------------------------------\\
                              Main
\\-------------------------------------------------------------------*/
const bard = getBard();
if (bard == null) { return; }
const info = getBardInfo(bard);
let tale = removeTale(bard);
if (tale == null) { tale = await getTale(bard,info); }
await showTale(tale);

/*-------------------------------------------------------------------\\
                            Functions
\\-------------------------------------------------------------------*/

// get bard from user actor, selected tokens, owned tokens in scene, owned actors
function getBard(){
	const UA2B =()=> [game.user.actor].filter(a => !!a && 'bard' in a.classes);
	const ST2B =()=> [...new Set(canvas.tokens.controlled.map(t => t.actor))].filter(a => 'bard' in a.classes);
	const OT2B =()=> [...new Set(canvas.tokens.ownedTokens.map(t => t.actor))].filter(a => 'bard' in a.classes);
	const OA2B =()=> game.actors.filter(a => 'bard' in a.classes && a.isOwner);
	var actors;
	for (let fun of [UA2B,ST2B,OT2B,OA2B]) { actors = fun(); if (actors.length>0){ break; } }
	if (actors.length == 0) { ui.notifications.warn('error: no bards selected'); return null; }
	if (actors.length > 1) { ui.notifications.warn('error: too many bards selected');  return null; }
	return actors[0];
}

// get bardic inspiration dice value and other parameters
function getBardInfo(bard){
	var info = {};
	info.BID = bard.items.getName("Bardic Inspiration").labels.damage.substring(1);
	info.CHA = bard.data.data.abilities.cha.mod;
	info.PB  = bard.data.data.prof.flat;
	info.SA  = Number(bard.data.data.bonuses.msak.attack) + info.CHA + info.PB;
	info.DC  = 8 + bard.data.data.bonuses.spell.dc + info.CHA + info.PB;
	info.BL  = bard.classes.bard.data.data.levels;
	return info;
}

// get bard tale if exists and remove tale
function removeTale(bard){
	const e = bard.effects.find(e=>e.data.label==effect_name);
	let val = null;
	if (e) {
		if ('statuscounter' in e.data.flags) { val = e.data.flags.statuscounter.counter.value; }
		bard.deleteEmbeddedDocuments('ActiveEffect',[e.id]);
	}
	return val;
}
		
// send tale info to chat 
async function showTale(tale,info){
	const name = 'Clever Animal,Renowned Duelist,Beloved Friends,Runaway,Avenger,Traveler,Beguiler,Phantom,Brute,Dragon,Angle,Mind-Bender'.split(',').map(s=>`Tale of the ${s}`)[tale-1];
	const items = await game.packs.contents.find(i=>i.title==comp_name).getDocuments();
	const item = items.find(i=>i.data.data.chatFlavor==name);
	let newData = deepObjMap(strReplace,item.data.data,info);
	const changes = Object.keys(newData).filter(k=>JSON.stringify(newData[k])!=JSON.stringify(item.data.data[k]));
	var newItemData = deepObjMap(v=>v,item.data);
	for (const k of changes) { newItemData.data[k] = newData[k]; }
	newItemData.img = image_path + newItemData.img.replace(/^.*[\\\/]/, '');
	const newItem = (await actor.createEmbeddedDocuments('Item',[newItemData]))[0];
	await newItem.roll();
	await actor.deleteEmbeddedDocuments('Item',[newItem.id]);
}

// deep object map function
function deepObjMap(fun,obj){
    if (obj && typeof(obj)==='object') {
        var newObj = (Array.isArray(obj)) ? [] : {};
        for (const [key,val] of Object.entries(obj)){
			newObj[key] = deepObjMap(fun,val,...Array.prototype.slice.call(arguments,2));
		}
        return newObj;
    } else {
        return fun(obj,...Array.prototype.slice.call(arguments,2));
    }
}

// string replace function
function strReplace(val,data){
    return (typeof(val)==='string') ? Handlebars.compile(val)(data) : val; 
}

// roll bardic dice for tale and apply
async function getTale(bard,info){
	const roll = new Roll(info.BID);
	await roll.toMessage({flavor:'Drawing a card from the Tarokka Deck:'});
	const result = roll.result;
	let data = game.items.getName('Custom Convenient Effects').data.effects.find(e=>e.data.label==effect_name).data;
	let counter = new ActiveEffectCounter(Number(result), data.icon, bard);
	counter.visible = true;
	counter.update();
	return result;
}