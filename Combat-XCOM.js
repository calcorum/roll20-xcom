// Assigning hit points and ACs to a newly assigned token
on("change:graphic:represents", function(token){
    let char = getObj("character", token.get("represents")) || null;
    if(char){
        let hitpoints = getAttribute(char, "attribute-health") || null;
        if(hitpoints){
            token.set({
                bar2_value: hitpoints,
                bar2_max: hitpoints,
                showplayers_bar3: true,
                showplayers_name: true,
                showname: true,
            });
        
            let bMove = MOBILITY[getAttribute(char, "attribute-mobility")]["blue"] || null;
            let yMove = MOBILITY[getAttribute(char, "attribute-mobility")]["yellow"] || null;
            // Set bar 1 to eac
            if(bMove) token.set("bar3_value", bMove);
            // Set bar 2 to kac
            if(yMove) token.set("bar1_value", yMove);
        }
    }
});

on("chat:message", function(msg){
    if(msg.type === "api" && msg.content.match(/^!attack/)){
        let attacker = null;
        let target = null;
        let attackerToken = null;
        let targetToken = null;
        let weapon = null;
        let cover = 0;
        let rangeMod = 0;
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
            if(LOGLEVEL > 2) log("Weapons / params / param: " + param);
            switch(param){
                case "attacker":
                    attacker = getChar(params[param]);
                    if(attacker){
                        if(LOGLEVEL > 2) log("Weapons / params / attacker: " + attacker.get("name"));
                    }else{
                        if(LOGLEVEL > 0) log("Weapons / params / Invalid attacker");
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Blue Rabbit");
                        return;
                    }
                    break;
                case "target":
                    target = getChar(params[param]);
                    if(target){
                        if(LOGLEVEL > 2) log("Weapons / params / target: " + target.get("name"));
                    }else{
                        if(LOGLEVEL > 0) log("Weapons / params / Invalid target");
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Yellow Chinchilla");
                        return;
                    }
                    break;
                case "weapon":
                    weapon = WEAPONLIST[params[param].toLowerCase()] || null;
                    if(weapon){
                        if(LOGLEVEL > 2) log("Weapons / params / weapon: " + weapon.name);
                    }else{
                        if(LOGLEVEL > 0) log("Weapons / params / Invalid weapon");
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Green Tabby");
                        return;
                    }
                    break;
                case "cover":
                    value = params[param];
                    if(parseInt(value) || value === "0"){ 
                        cover = value;
                        if(LOGLEVEL > 2) log("Weapons / params / cover: " + cover);
                    }else{
                        if(LOGLEVEL > 0) log("Weapons / params / Invalid cover");
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Silver Anteater");
                        return;
                    }
                    break;
                case "attackerToken":
                    value = params[param];
                    tObj = getObj('graphic',value);
                    if(tObj){
                        attackerToken = tObj;
                        if(LOGLEVEL > 2) log("Weapons / params / attacker token found");
                    }else{
                        if(LOGLEVEL > 0) log("Weapons / params / could not find attacker token");
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Navy Platypus");
                        return;
                    }
                    break;
                case "targetToken":
                    value = params[param];
                    tObj = getObj('graphic',value);
                    if(tObj){
                        targetToken = tObj;
                        if(LOGLEVEL > 2) log("Weapons / params / target token found");
                    }else{
                        if(LOGLEVEL > 0) log("Weapons / params / could not find target token");
                        sendMessage(getChar("Clippy"),msg.who,"Error Code: Pink Tabby");
                        return;
                    }
                    break;
                default:
                    if(LOGLEVEL > 0) log("Weapons / params / Unrecognized parameter");
                    sendMessage(getChar("Clippy"),msg.who,"Error Code: Mauve Toad");
                    break;
            }
        }
        
        // Parameter Checks
        if(!attacker) return;
        if(!target) return;
        if(!weapon) return;
        if(!attackerToken) return;
        if(!targetToken) return;
        
        // ---------------------------------------------------------
        
        // Determine attacker's Aim
        // Check base aim
        let attackerAimBase = 0;
        let tempAim = getAttribute(attacker,"attribute-aim");
        if(parseInt(tempAim)) attackerAimBase = tempAim;
        else{
            if(LOGLEVEL > 0) log("Weapons / main / attacker has no Aim");
            sendMessage(getChar("Clippy"),msg.who,"Error Code: Pink Hippo");
        }
        if(LOGLEVEL > 2) log("Weapons / main / attacker base aim: " + attackerAimBase);
        
        // Check for Aim Bonus
        let attackerAimBonus = 0;
        let tempAimBonus = getAttribute(attacker,"temp-aimBonus");
        if(parseInt(tempAimBonus)) attackerAimBonus = tempAimBonus;
        if(LOGLEVEL > 2) log("Weapons / main / attacker aim bonus: " + tempAimBonus);
        
        // Check for Aim Penalty
        let attackerAimPenalty = 0;
        let tempAimPenalty = getAttribute(attacker,"temp-aimPenalty");
        if(parseInt(tempAimPenalty)) attackerAimPenalty = tempAimPenalty;
        if(LOGLEVEL > 2) log("Weapons / main / attacker aim penalty: " + tempAimPenalty);
        
        // Calculate adjusted Aim Value
        let attackerAim = attackerAimBase + attackerAimBonus - attackerAimPenalty;
        if(LOGLEVEL > 2) log("Weapons / main / attacker adjusted aim: " + attackerAim);
        
        // Determine Target's Defense
        // Check base defense
        let targetDefenseBase = 0;
        let tempDefenseBase = getAttribute(target,"attribute-defense");
        if(parseInt(tempDefenseBase)) targetDefenseBase = tempDefenseBase;
        if(LOGLEVEL > 2) log("Weapons / main / target base defense: " + targetDefenseBase);
        
        // Check for Defense Bonus
        let targetDefenseBonus = 0;
        let tempDefenseBonus = getAttribute(target,"temp-defenseBonus");
        if(parseInt(tempDefenseBonus)) targetDefenseBonus = tempDefenseBonus;
        if(LOGLEVEL > 2) log("Weapons / main / target defense bonus: " + targetDefenseBonus);
        
        // Check for Defense Penalty
        let targetDefensePenalty = 0;
        let tempDefensePenalty = getAttribute(attacker,"temp-defensePenalty");
        if(parseInt(tempDefensePenalty)) targetDefensePenalty = tempDefensePenalty;
        if(LOGLEVEL > 2) log("Weapons / main / target defense penalty: " + targetDefensePenalty);
        
        // Calculate adjusted Defense Value
        let targetDefense = targetDefenseBase + targetDefenseBonus - targetDefensePenalty;
        if(LOGLEVEL > 2) log("Weapons / main / Target adjusted defense: " + targetDefense);
        
        // ---------------------------------------------------------
        // Check distance
        let distance = distBetween(attackerToken, targetToken);
        let rMod = weapon.range[distance];
        if(LOGLEVEL > 2) log("Weapons / main / rMod: " + rMod);
        if(parseInt(rMod)) rangeMod = rMod;
        else rangeMod = weapon.range.other;
        if(LOGLEVEL > 2) log("Weapons / main / rangeMod: " + rangeMod);
        
        // ---------------------------------------------------------
        
        // Check for a hit
        let toHitChance = parseInt(attackerAim - targetDefense - cover + rangeMod);
        let toHitDie = randomInteger(100);
        let damage = 0;
        let critChance = parseInt(0);
        let critDie = parseInt(999);
        let weaponCrit = parseInt(0);
        let flankCrit = parseInt(0);
        
        if(LOGLEVEL > 1) log("Weapons / main / toHitChance: " + toHitChance);
        if(LOGLEVEL > 1) log("Weapons / main / toHitDie: " + toHitDie);
        
        let outcome = "Miss";
        
        // Get crit chance
        if(parseInt(weapon.critChance)) weaponCrit += weapon.critChance;
        if(cover == 0) flankCrit = 40;
        critChance = parseInt(weaponCrit) + parseInt(flankCrit);
        if(LOGLEVEL > 1) log("Weapons / main / critChance: " + critChance);
        
        if(toHitDie <= toHitChance) { 
            damage = weapon.damage;
            outcome = "HIT";
            
            // Check for crit
            if(critChance > 0){
                critDie = randomInteger(100);
                if(LOGLEVEL > 1) log("Weapons / main / critDie: " + critDie);
                if(critDie <= critChance){
                    damage += "+" + parseInt(weapon.critDamage);
                    outcome = "CRIT";
                }
            }
        }
        
        let piString = "&{template:default} {{name=Perfect Information}} {{Attacker=" + attackerToken.get("name") + "}} " +
            "{{Target=" + targetToken.get("name") + "}} {{Hit Chance=" + toHitChance + "%}} " + 
            "{{Hit Roll=" + toHitDie + "}} " + "{{Crit Chance=" + critChance + "%}} {{Crit Roll=" + critDie + "}}";
            
        if(PLAYERLOG) sendMessage(getChar("Clippy"),msg.who,piString);
        
        if(outcome !== "Miss"){
            outcome += " for [[" + damage + "]] !";
        }
        
        sendMessage(attacker,null,attacker.get("name") + " fires the " + weapon.name + " at the " + target.get("name") + "!");
        sendMessage(attacker,null,weapon.noise);
        sendMessage(attacker,null,outcome);
        
        if(LOGLEVEL > 0) log("Combat-XCOM / main / END ATTACK ------------------------------");
    }
});
