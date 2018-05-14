function getAttribute(char, attrName, which="current"){
    let rawVal = getAttrByName(char.get("id"), attrName, which);
    if (isNaN(rawVal)) return rawVal;
    else return parseInt(rawVal);
}

function sendMessage(from, to, msg){
    let whisper = "";
    if(to){
        if(typeof to === 'string'){
            whisper = "/w " + to.split(" ")[0];
        }else{
            whisper = "/w " + to.get("name").split(" ")[0];
        }
    }
    sendChat("character|" + from.get("id"), whisper + " " + msg);
}

function capitalizeFirst(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function getChar(nameOrId){
    log("nameOrId: " + nameOrId);
    let character = findObjs({
        _type: "character",
        name: nameOrId,
    })[0];
    if(character) return character;
    else{
        let character = getObj("character", nameOrId);
        if(character) return character;
        else return null;
    }
    /*switch(charName){
        case 'Player Account': 
            return findObjs({_type: "character",name: "Teste McButtface",})[0];
        case 'Rogue Physicist':
            return findObjs({_type: "character",name: "Riemann 2",})[0];
        case 'Logan G.':
            return findObjs({_type: "character",name: "Delta 1",})[0];
        case 'Josh F.':
            return findObjs({_type: "character",name: "Leb",})[0];
        case 'Ryan K.':
            return findObjs({_type: "character",name: "Roze",})[0];
        default:
            return null;
    }*/
}
