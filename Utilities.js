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

on("chat:message", function(msg){
    if(msg.type === "api" && msg.content.match(/^!distance/)){
        log("Distance / main / msg.content: " + msg.content);
        
        // Remove the command and return if there's nothing else
        let rawInput = msg.content.replace("!distance ","");
        if(rawInput.length <= 0){
            sendMessage(getChar("Clippy"),msg.who,"Error Code: Black Emu");
            return;
        }
        if(LOGLEVEL > 2) log("Distance / main / rawinput: " + rawInput);
        
        // Create string array with each space-separated parameter
        let input = rawInput.split(" ");
        if(LOGLEVEL > 2) log("Distance / main / input: " + input);
        
        let token1 = getObj('graphic', input[0].split("=")[1]);
        let token2 = getObj('graphic', input[1].split("=")[1]);
        let distance = distBetween(token1, token2);
        
        log("distance between them: " + distance + " tile(s)");
        sendMessage(getChar("Clippy"),msg.who,"The distance between those characters is: " + distance + " tile(s).");
    }
    
    if(msg.type === "api" && msg.content.match(/^!checkShot/)){
        log("Distance / main / msg.content: " + msg.content);
        
        // Remove the command and return if there's nothing else
        let rawInput = msg.content.replace("!checkShot ","");
        if(rawInput.length <= 0){
            sendMessage(getChar("Clippy"),msg.who,"Error Code: Black Emu");
            return;
        }
        if(LOGLEVEL > 2) log("Distance / main / rawinput: " + rawInput);
        
        // Create string array with each space-separated parameter
        let input = rawInput.split(" ");
        if(LOGLEVEL > 2) log("Distance / main / input: " + input);
        
        let token1 = getObj('graphic', input[0].split("=")[1]);
        let token2 = getObj('graphic', input[1].split("=")[1]);
        let distance = distBetween(token1, token2);
        
        log("distance between them: " + distance + " tile(s)");
        sendMessage(getChar("Clippy"),msg.who,"The distance between those characters is: " + distance + " tile(s).");
    }
});
