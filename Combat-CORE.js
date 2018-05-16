/** 
 * Constant variables:
 * - LOGLEVEL: Integer
 * -- 0 = None
 * -- 1 = Errors
 * -- 2 = Errors + Dice
 * -- 3 = Errors + Dice + Full Details
 * - AUTOHIT: Boolean
 * - AUTOCRIT: Boolean
 * - PLAYERLOG: Boolean
 */
const LOGLEVEL = 3;
const AUTOHIT = false;
const AUTOCRIT = false;
const PLAYERLOG = true;

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
}

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
            if(LOGLEVEL > 2) log("Combat-CORE / import Character / params: " + param)
            if(param.match(/^name=/)){
                char.set("name", param.split("=")[1].replace("_"," "));
            }else{
                let attrName = param.split("=")[0];
                let attrVal = param.split("=")[1];
                setAttribute(char, attrName, attrVal);
                if(param.match(/health=/)) setAttribute(char, attrName, attrVal, "max");
            }
        });
    });
}

function hpNotice(name, hp){
    sendMessage(getChar("Clippy"),null,"Kill shot! " + name + "'s HP just went to " + hp + ".");
}

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
        hpNotice(token.get("name"), bar2Value);
    }else if(bar2Value === 0){
        token.set({
            statusmarkers: "dead",
        });
        hpNotice(token.get("name"), bar2Value);
    }
});

/**
 * Imports character data from the bio section of the Roll20 Character Object 
 */
on("chat:message", function(msg){
    if(msg.type === "api" && msg.content.match(/^!import/)){
        let paramResp = getParameters(msg.content, "!import ");
        
        if(paramResp.success){
            let charId = paramResp.vals["charId"] || null;
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





// Blank line to fill space in browser :)
