function capitalizeFirst(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function distBetween(tokenA, tokenB){
    let t1 = {
        x: tokenA.get('left'),
        y: tokenA.get('top')
    };
    if(LOGLEVEL > 2) log("Utilities / distBetween / t1.x: " + t1.x + " / t1.y: " + t1.y);
    let t2 = {
        x: tokenB.get('left'),
        y: tokenB.get('top')
    };
    if(LOGLEVEL > 2) log("Utilities / distBetween / t2.x: " + t2.x + " / t2.y: " + t2.y);
    
    let distance = (Math.sqrt( Math.pow( (t1.x-t2.x),2)+Math.pow( (t1.y-t2.y),2))/70);
    if(LOGLEVEL > 1) log("Utilities / distBetween / distance: " + distance);
    
    return Math.round(distance);
}

function getChar(nameOrId){
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
