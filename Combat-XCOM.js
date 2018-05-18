/*jshint esversion: 6 */

/**
 * Called by Combat-CORE.importCharacter to support any updates following Attributes
 * @param  Roll20 Character Object  char the character to be updated
 * @return None
 */
function importGameSpecifics(char){
    return;
}

/**
 * Update stats on token when the "represents" tag is updated
 * @param  Roll20 Token Object  token
 * @return none
 */
function updateToken(token){
    let char = getObj("character", token.get("represents")) || null;
    if(char){
        let hitpoints = getAttribute(char, "attribute-health") || null;
        if(hitpoints){
            let ablative = getAttribute(char, "gear-ablative") || 0;
            token.set({
                bar2_value: hitpoints + ablative,
                bar2_max: hitpoints,
                showplayers_bar3: true,
                showplayers_name: true,
                showname: true,
            });
        
            let bMove = MOBILITY[getAttribute(char, "attribute-mobility")].blue || null;
            let yMove = MOBILITY[getAttribute(char, "attribute-mobility")].yellow || null;
            // Set bar 1 to eac
            if(bMove) token.set("bar3_value", bMove);
            // Set bar 2 to kac
            if(yMove) token.set("bar1_value", yMove);
        }
    }
}

// Assigning hit points and ACs to a newly assigned token
on("change:graphic:represents", function(token){
    updateToken(token);
});

// Accepting the api commands for XCOM
on("chat:message", function(msg){
    if(msg.type === "api" && msg.content.match(/^!attack/)){

        //////////////////////////
        // API COMMAND: !attack //
        //////////////////////////

        let attacker = null;
        let target = null;
        let attackerToken = null;
        let targetToken = null;
        let weapon = null;
        let cover = 0;
        let rangeMod = 0;
        let overwatch = 0;
        let input = null;
        
        if(LOGLEVEL > 2) log("Combat-XCOM / main / msg.content: " + msg.content);
        
        // Parse the message content for parameters
        let paramResp = getParameters(msg.content, "!attack ");
        if(paramResp.success){
            params = paramResp.vals;
        }else{
            sendMessage(getChar("Clippy"),msg.who,paramResp.error, true);
        }
        
        // Process each of the parameters
        for(param in params){
            if(LOGLEVEL > 2) log("Combat-XCOM / params / param: " + param);
            switch(param){
                case "attacker":
                    attacker = getChar(params[param]);
                    if(attacker){
                        if(LOGLEVEL > 2) log("Combat-XCOM / params / attacker: " + attacker.get("name"));
                    }else{
                        if(LOGLEVEL > 0) log("Combat-XCOM / params / Invalid attacker");
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Blue Rabbit");
                        return;
                    }
                    break;
                case "target":
                    target = getChar(params[param]);
                    if(target){
                        if(LOGLEVEL > 2) log("Combat-XCOM / params / target: " + target.get("name"));
                    }else{
                        if(LOGLEVEL > 0) log("Combat-XCOM / params / Invalid target");
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Yellow Chinchilla");
                        return;
                    }
                    break;
                case "weapon":
                    weapon = WEAPONLIST[params[param].toLowerCase()] || null;
                    if(weapon){
                        if(LOGLEVEL > 2) log("Combat-XCOM / params / weapon: " + weapon.name);
                    }else{
                        if(LOGLEVEL > 0) log("Combat-XCOM / params / Invalid weapon: " + params[param]);
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Green Tabby");
                        return;
                    }
                    break;
                case "cover":
                    cover = params[param];
                    if(cover || cover == 0){
                        if(LOGLEVEL > 2) log("Combat-XCOM / params / cover: " + cover);
                    }else{
                        if(LOGLEVEL > 0) log("Combat-XCOM / params / Invalid cover: " + params[param]);
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Silver Anteater");
                        return;
                    }
                    break;
                case "attackerToken":
                    attackerToken = getObj('graphic',params[param]) || null;
                    if(attackerToken){
                        if(LOGLEVEL > 2) log("Combat-XCOM / params / attacker token found");
                    }else{
                        if(LOGLEVEL > 0) log("Combat-XCOM / params / could not find attacker token");
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Navy Platypus");
                        return;
                    }
                    break;
                case "targetToken":
                    targetToken = getObj('graphic', params[param]) || null;
                    if(targetToken){
                        if(LOGLEVEL > 2) log("Combat-XCOM / params / target token found");
                    }else{
                        if(LOGLEVEL > 0) log("Combat-XCOM / params / could not find target token");
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Pink Tabby");
                        return;
                    }
                    break;
                case "overwatch":
                    overwatch = params[param];
                    if(overwatch || overwatch == 0){
                        if(LOGLEVEL > 2) log("Combat-XCOM / params / overwatch: " + overwatch);
                    }
                    break;
                default:
                    if(LOGLEVEL > 0) log("Combat-XCOM / params / Unrecognized parameter");
                    sendMessage(getChar("Clippy"),msg.who,"Error Code: Mauve Toad");
                    break;
            }
        }
        
        // ---------------------------------------------------------
        
        // Determine attacker's Aim
        let aimResp = getAttrSums(
            [
                [attacker,"attribute-aim"],
                [attacker,"temp-aimBonus"],
                [target,"temp-defensePenalty"]
            ],
            [
                [attacker,"temp-aimPenalty"],
                [target,"attribute-defense"],
                [target,"temp-defenseBonus"]
            ]
        );

        // ---------------------------------------------------------
        // Check distance
        let distance = distBetween(attackerToken, targetToken);
        let rMod = weapon.range[distance];
        //rangeMod = weapon.range[distance] || weapon.range.other;
        if(LOGLEVEL > 2) log("Combat-XCOM / main / rMod: " + rMod);
        if(parseInt(rMod) || rMod == 0) rangeMod = rMod;
        else rangeMod = weapon.range.other;
        if(LOGLEVEL > 2) log("Combat-XCOM / main / rangeMod: " + rangeMod);
        
        // ---------------------------------------------------------        
        // Check for a hit
        let toHitChance = aimResp.vals.total + rangeMod - cover - overwatch;
        let toHitDie = randomInteger(100);
        let damage = 0;
        let critChance = parseInt(0);
        let critDie = parseInt(999);
        let weaponCrit = parseInt(0);
        let flankCrit = parseInt(0);
        
        if(LOGLEVEL > 1) log("Combat-XCOM / main / cover: " + cover);
        if(LOGLEVEL > 1) log("Combat-XCOM / main / toHitChance: " + toHitChance);
        if(LOGLEVEL > 1) log("Combat-XCOM / main / toHitDie: " + toHitDie);
        
        let outcome = "Miss";
        
        // Get crit chance
        if(parseInt(weapon.critChance)) weaponCrit += weapon.critChance;
        if(cover == 0) flankCrit = 40;
        critChance = parseInt(weaponCrit) + parseInt(flankCrit);
        if(LOGLEVEL > 1) log("Combat-XCOM / main / critChance: " + critChance);
        
        if(toHitDie <= toHitChance) { 
            damage = weapon.damage;
            outcome = "HIT";
            
            // Check for crit
            if(critChance > 0 && params.overwatch == null){
                critDie = randomInteger(100);
                if(LOGLEVEL > 1) log("Combat-XCOM / main / critDie: " + critDie);
                if(critDie <= critChance){
                    damage += "+" + parseInt(weapon.critDamage);
                    outcome = "CRIT";
                }
            }
        }
        
        let piString = "&{template:default} {{name=Perfect Information}} {{Attacker=" + attackerToken.get("name") + "}} " +
            "{{Target=" + targetToken.get("name") + "}} {{Hit Chance=" + toHitChance + "%}} " + 
            "{{Hit Roll=" + toHitDie + "}} " + "{{Crit Chance=" + critChance + "%}} {{Crit Roll=" + critDie + "}}";
            
        if(PLAYERLOG) sendMessage(getChar("Clippy"),msg.who,piString,true);
        
        if(outcome !== "Miss"){
            outcome += " for [[" + damage + "]] !";
        }
        
        sendMessage(attacker,null,attacker.get("name").split(" ")[0] + " fires the " + weapon.name + " at the " + target.get("name") + "!");
        sendMessage(attacker,null,weapon.noise);
        sendMessage(attacker,null,outcome);
        
        if(LOGLEVEL > 0) log("Combat-XCOM / main / END ATTACK ------------------------------");
    
    }else if(msg.type === "api" && msg.content.match(/^!updateToken/)){

        ///////////////////////////////
        // API COMMAND: !updateToken //
        ///////////////////////////////

        // Parse the message content for parameters
        let paramResp = getParameters(msg.content, "!updateToken ");
        let params = null;
        if(paramResp.success){
            params = paramResp.vals;
        }else{
            sendMessage(getChar("Clippy"),msg.who,paramResp.error, true);
        }

        // get tokenID
        let tokenId = params.tokenid;
        let token = getObj("graphic",tokenId);
        if(LOGLEVEL > 2) log("Combat-XCOM / updateToken / tokenId: " + tokenId);
        if(LOGLEVEL > 2) log("Combat-XCOM / updateToken / token: " + token);

        // update token
        updateToken(getObj("graphic", tokenId));
        if(LOGLEVEL > 1) log("Combat-XCOM / updateToken / Successfully updated token id: " + tokenId);

    }else if(msg.type === "api" && msg.content.match(/^!overwatch/)){

        /////////////////////////////
        // API COMMAND: !overwatch //
        /////////////////////////////

        // TODO: DO STUFF FOR OVERWATCH!
        
        // GET CHARACTER
        
        // SET OVERWATCH STATUS ICON
        
        // REMOVE STANDARD ABILITIES FROM TOKEN ACTION
        
        // SET OVERWATCH SHOT ABILITY TO TOKEN ACTION
        
        log("Combat-XCOM / overwatch / I'M HERE!!!");
        sendMessage(getChar(),null,"!attack boobs");
    }

});
