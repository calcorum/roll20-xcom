/*jshint esversion: 6 */

/** 
 * Required constant variables:
 * - LOGLEVEL: Integer
 * -- 0 = None
 * -- 1 = Errors
 * -- 2 = Errors + Success/Failure/Dice
 * -- 3 = Errors + Success/Failure/Dice + Full Details
 * - AUTOHIT: Boolean
 * - AUTOCRIT: Boolean
 * - PLAYERLOG: Boolean - true to whisper details of the roll to the player
 * - CHARGENATTRS: [[attr-name,current,max],[attr-name,current,max]...[attr-name,current,max]]
 * - CHARGENABILS: [[abil-name,action,isTokenAction],[abil-name,action,isTokenAction]...[abil-name,action,isTokenAction]]
 */

/**
 * Required functions:
 * - importGameSpecifics
 * -- called by importCharacter; this function is called to support updating the character once attributes are imported from the bio
 * -- @param Roll20 Character object    the character to be updated
 * -- returns None
 */

////////////////////////////
// BEGIN HELPER FUNCTIONS //
////////////////////////////

/**
 * This function capitalizes the first character in a string and returns it
 * @param  String string    the string in question 
 * @return String           the string with a capital first letter
 */
function capitalizeFirst(string){
    return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Calculates the distance between two tokens
 * @param  Roll20 Token tokenA
 * @param  Roll20 Token tokenB 
 * @return Integer      Distance between the two tokens rounded to the nearest whole number
 */
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

/**
 * Retrieves an attribute value from a character sheet
 * Params:
 * - char: Roll20 Character Object
 * - attrName: String / name of the attribute
 * - which (optional): String / "current" or "max", defaults to current
 * Returns:
 * - If value is a number, returns an Integer
 * - If value is NAN, returns the raw value from the attribute
 */
function getAttribute(char, attrName, which="current"){
    let rawVal = getAttrByName(char.get("id"), attrName, which);
    if (isNaN(rawVal)) return rawVal;
    else return parseInt(rawVal);
    return 0;
}

/**
 * Takes the character name or ID or player names (from PLAYERMAP) and returns the Roll20 Character object
 * @param   nameOrId                 characterID or character name or player name as noted in the constant PLAYERMAP   
 * @return Roll20 character or null     
 */
function getChar(nameOrId){
    let character = findObjs({
        _type: "character",
        name: nameOrId,
    })[0] || null;
    if(character) return character;
    else{
        let character = getObj("character", nameOrId) || null;
        if(character) return character;
        else{
            return findObjs({_type: "character", name: PLAYERMAP[nameOrId]})[0] || null;
        }
    }
}

/**
 * Takes the full message text beginning with "!" and returning key pairs of parameters
 * Params:
 * - content: String / full msg.content
 * - trigger: String / text including the '!' to activate the api and the following " "
 * Returns an object with the following keys:
 * - success: Boolean / true if successful, false if an error occurred
 * - error: String / resulting error code
 * - vals: Object containing the parameter key/value pairs
 */
function getParameters(content, trigger){
    let output = {"success":true, "error":"None", "vals":{}};
    
    // Remove the command and return if there's nothing else
    let rawInput = content.replace(trigger,"");
    if(rawInput.length <= 0){
        output.error = "Error Code: Brown Ferret";
        output.success = false;
        return output;
    }
    if(LOGLEVEL > 2) log("Combat-CORE / getParameters / rawinput: " + rawInput);
    
    // Create object with each space-separated parameter as key/value
    let pairs = rawInput.split(" ");
    for(pair in pairs){
        let key = pairs[pair].split("=")[0];
        let value = pairs[pair].split("=")[1];
        output.vals[key] = value;
        if(LOGLEVEL > 2) log("Combat-CORE / getParameters / key: " + key + " / value: " + output.vals[key]);
    }
    
    return output;
}

/**
 * getAttrSums is a simple calculator subtracting the sum of neg from the sum of pos
 * @param  array    posVals     array of positive attributes [[character object,attribute name],[character object,attribute name]]
 * @param  array    negVals     array of negative attributes [[character object,attribute name],[character object,attribute name]]
 * @return object               {success:<boolean>,error:<String player error text>,vals:{positive:<integer>,negative:<integer>}}
 */
function getAttrSums(posVals, negVals){
    let output = {"success":true, "error":"None", "vals":{}};
    let positive = 0;
    let negative = 0;
    let total = 0;

    for(x in posVals){
        let posResp = getAttribute(posVals[x][0],posVals[x][1]) || 0;
        if(parseInt(posResp)){
            positive += posResp;
            if(LOGLEVEL > 2) log("Combat-CORE / getTotal / Adding positive (" + posVals[x][1] + "): " + posResp);
        }else{
            if(LOGLEVEL > 2) log("Combat-CORE / getTotal / Excluding positive (" + posVals[x][1] + "): " + posResp);
        }
    }

    for(x in negVals){
        let negResp = getAttribute(negVals[x][0],negVals[x][1]) || 0;
        if(parseInt(negResp)){
            negative += negResp;
            if(LOGLEVEL > 2) log("Combat-CORE / getTotal / Adding negative (" + negVals[x][1] + "): " + negResp);
        }else{
            if(LOGLEVEL > 2) log("Combat-CORE / getTotal / Excluding negative (" + negVals[x][1] + "): " + negResp);
        }
    }

    total = positive - negative;

    if(LOGLEVEL > 2){
        log("Combat-CORE / getTotal / Positive sum: " + positive);
        log("Combat-CORE / getTotal / Negative sum: " + negative);
        log("Combat-CORE / getTotal / Total: " + total);
    }

    output.vals.positive = positive;
    output.vals.negative = negative;
    output.vals.total = total;
    return output;
}

/**
 * Simple wrapper for sending the kill shot message
 * @param  String   name name of dead character
 * @param  int      hp   final HP of dead character
 * @return none
 */
function hpNotice(name, hp){
    sendMessage(getChar("Clippy"),null,"Kill shot! " + name + "'s HP just went to " + hp + ".");
}

/**
 * Import character data from JSON text in notes section
 * Params:
 * - char: Roll20 Character Object
 * Returns an object with the following keys:
 * - success: Boolean / true if successful, false if an error occurred
 * - error: String / resulting error code
 */
function importCharacter(char){
    char.get("bio",function(bio){
        let params = bio.split(" ");
        _.each(params, function(param){
            if(LOGLEVEL > 2) log("Combat-CORE / import Character / params: " + param);
            if(param.match(/^name=/)){
                char.set("name", param.split("=")[1].replace("_"," "));
            }else{
                let attrName = param.split("=")[0];
                let attrVal = param.split("=")[1];
                setAttribute(char, attrName, attrVal);
                if(param.match(/health=/)) setAttribute(char, attrName, attrVal, "max");
            }
        });
        importGameSpecifics(char);
        sendMessage(getChar("Clippy"),char.get("name"),"I just imported " + char.get("name") + "'s stats!",true);
    });
}

/**
 * Sends a Roll20 message; wrapper for the sendChat command
 * Params:
 * - from: Roll20 Character Object
 * - to: Roll20 Character Object or String / Roll20 Player name
 * - msg: String / text to send in the chat
 * - gmLog (optional): Boolean / send a copy of the message to the GM (default: false)
 * Returns: None
 */
function sendMessage(from, to, msg, gmLog = false){
    let whisper = "";
    let nameText = "";
    if(to){
        if(typeof to === 'string'){
            nameText = to.split(" ")[0];
        }else{
            nameText = to.get("name").split(" ")[0];
        }
        whisper ="/w " + nameText;
    }
    sendChat("character|" + from.get("id"), whisper + " " + msg);
    if(gmLog) sendChat("character|" + from.get("id"), "/w GM Message sent to " + nameText + ": " + msg);
}

/**
 * @param char Roll20Character 
 * @param attrName String name of attribute to be modified
 * @param val Any value to set in attribute
 * @param which String specify "current" or "max"; defaults to current
 */
function setAttribute(char, attrName, val, which="current"){
    let attrObj = findObjs({type: "attribute", characterid: char.id, name: attrName})[0] || null;
    
    if(attrObj){
        attrObj.set(which, val);
    }else{
        createObj("attribute",{
            name: attrName,
            current: val,
            characterid: char.id
        });
    }
}

/////////////////////
// BEGIN LISTENERS //
/////////////////////

/**
 * Adds defaults to each created character
 * Requires CHARGENATTRS and CHARGENABILS constants
 * CHARGENATTRS: [[attr-name,current,max],[attr-name,current,max]...[attr-name,current,max]]
 * CHARGENABILS: [[abil-name,action,isTokenAction],[abil-name,action,isTokenAction]...[abil-name,action,isTokenAction]]
 */
on("ready", function(){
    on("add:character", function(char){

        // Import Attributes
        _.each(CHARGENATTRS, function(attr){
            createObj("attribute",{
                name:attr[0],
                current: attr[1],
                max: attr[2],
                characterid: char.id
            });        
        });
        
        // Import Abilities
        _.each(CHARGENABILS, function(ability){
            createObj("ability",{
                name: ability[0],
                action: ability[1],
                isTokenAction: ability[2],
                characterid: char.id
            });
        });
    });
});

// For hitpoint tracking
on("change:graphic:bar2_value", function(token) {
    // Don't trigger if the token represents a character
    // NPCs never represent a character to keep their HPs from syncing
    let bar2Value = token.get("bar2_value");
    if(token.get("bar2_link") != ""){
        return;
    }else if(bar2Value < 0){
        token.set({
            bar2_value: 0,
            statusmarkers: "dead",
        });
    }else if(bar2Value === 0){
        token.set({
            statusmarkers: "dead",
        });
    }
    hpNotice(token.get("name"), bar2Value);
});

// UNIMPLMENTED
on("chat:message", function(msg){
    if(msg.type === "api" && msg.content.match(/^!checkShot/)){
        log("Combat-CORE / checkShot / msg.content: " + msg.content);
        
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

/**
 * Accepts the !distance message and returns the tiles between two tokens
 */
on("chat:message", function(msg){
    if(msg.type === "api" && msg.content.match(/^!distance/)){
        let params = null;
        if(LOGLEVEL > 2) log("Combat-CORE / main / msg.content: " + msg.content);

        let paramResp = getParameters(msg.content, "!distance ");
        if(paramResp.success){
            params = paramResp.vals;
        }else{
            sendMessage(getChar("Clippy"),msg.who,paramResp.error, true);
        }
        
        let token1 = getObj('graphic', params.token1);
        let token2 = getObj('graphic', params.token2);
        let distance = distBetween(token1, token2);
        
        log("distance between them: " + distance + " tile(s)");
        sendMessage(getChar("Clippy"),msg.who,"The distance between those characters is: " + distance + " tile(s).");
    }
});

/**
 * Imports character data from the bio section of the Roll20 Character Object 
 */
on("chat:message", function(msg){
    if(msg.type === "api" && msg.content.match(/^!import/)){
        let paramResp = getParameters(msg.content, "!import ");
        
        if(paramResp.success){
            let charId = paramResp.vals.charId || null;
            if(!charId){
                sendMessage(getChar("Clippy"),msg.who,"Error Code:  Slate Panda", true);
                if(LOGLEVEL > 0) log("Combat-CORE / import / Invalid charID: " + charId);
                return;
            }
            
            let char = getChar(charId) || null;
            if(!char){
                sendMessage(getChar("Clippy"),msg.who,"Error Code:  Lime Chinchilla", true);
                if(LOGLEVEL > 0) log("Combat-CORE / import / Error importing character ID: " + charId);
                return;
            }
        
            importCharacter(char);
            
        }else{
            sendMessage(getChar("Clippy"),msg.who,paramResp.error,true);
            if(LOGLEVEL > 0) log("Combat-CORE / import / Import failed: " + paramResp.error);
        }
    }
});

/**
 * Randomizes pre-defined stats for a character
 * TODO: IMPLEMENT THIS FUNCTION :)
 */
on("chat:message", function(msg){
    if(msg.type === "api" && msg.content.match(/^!randStats/)){
        let paramResp = getParameters(msg.content, "!randStats ");
        let charName = "";
        let token = null;
        
        if(paramResp.success){
            charName = paramResp.vals.charName || null;
            if(!charName){
                sendMessage(getChar("Clippy"),msg.who,"Error Code: Aqua Walrus", true);
                if(LOGLEVEL > 0) log("Combat-CORE / randStats / Can't find tokenId: " + paramResp.vals.tokenId);
                return;
            }
            token = getObj('graphic',paramResp.vals.tokenId)[0] || null;
            if(!token){
                sendMessage(getChar("Clippy"),msg.who,"Error Code: Purple Falcon", true);
                if(LOGLEVEL > 0) log("Combat-CORE / randStats / Can't find tokenId: " + paramResp.vals.tokenId);
                return;
            }
        }else{
            sendMessage(getChar("Clippy"),msg.who,paramResp.error, true);
            if(LOGLEVEL > 0) log("Combat-CORE / randStats / Import failed: " + paramResp.error);
            return;
        }
        
        //setAttribute()
    }
});
