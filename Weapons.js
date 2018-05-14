/* 0 = None
 * 1 = Errors
 * 2 = Errors + Dice
 * 3 = ERrors + Dice + Health Details
 */
const LOGLEVEL = 3;
const AUTOHIT = false;
const AUTOCRIT = false;
const PERFECTINFORMATION = true;

on("chat:message", function(msg){
    if(msg.type === "api" && msg.content.match(/^!useweapon/)){
        let shooter = null;
        let target = null;
        let weapon = null;
        let cover = 0;
        let rangeMod = 0;
        
        // Remove the command and return if there's nothing else
        let rawInput = msg.content.replace("!useweapon ","");
        if(rawInput.length <= 0){
            sendMessage(getChar("Clippy"),msg.who,"Error Code: Brown Ferret");
            return;
        }
        if(LOGLEVEL == 3) log("Weapons / main / rawinput: " + rawInput);
        
        // Create string array with each space-separated parameter
        let input = rawInput.split(" ");
        if(LOGLEVEL == 3) log("Weapons / main / input: " + input);
        
        // Process each of the parameters
        _.each(input, function(param){
            if(LOGLEVEL == 3) log("Weapons / params / param: " + param);
            if(param.match(/^shooter=/)){
                shooter = getChar(param.split("=")[1]);
                if(shooter){
                    if(LOGLEVEL == 3) log("Weapons / params / shooter: " + shooter.get("name"));
                }else{
                    if(LOGLEVEL > 0) log("Weapons / params / Invalid shooter");
                    sendMessage(getChar("Clippy"),msg.who,"Error Code: Blue Rabbit");
                    return;
                }
            }else if(param.match(/^target=/)){
                target = getChar(param.split("=")[1]);
                if(target){
                    if(LOGLEVEL == 3) log("Weapons / params / target: " + target.get("name"));
                }else{
                    if(LOGLEVEL > 0) log("Weapons / params / Invalid target");
                    sendMessage(getChar("Clippy"),msg.who,"Error Code: Yellow Chinchilla");
                    return;
                }
                
            }else if(param.match(/^weapon=/)){
                weapon = WEAPONLIST[param.split("=")[1].toLowerCase()];
                if(weapon){
                    if(LOGLEVEL == 3) log("Weapons / params / weapon: " + weapon.name);
                }else{
                    if(LOGLEVEL > 0) log("Weapons / params / Invalid weapon");
                    sendMessage(getChar("Clippy"),msg.who,"Error Code: Green Tabby");
                    return;
                }
            }else if(param.match(/^cover=/)){
                value = param.split("=")[1];
                if(parseInt(value)){ 
                    cover = value;
                    if(LOGLEVEL == 3) log("Weapons / params / cover: " + cover);
                }
                else{
                    if(LOGLEVEL > 0) log("Weapons / params / Invalid cover");
                    sendMessage(getChar("Clippy"),msg.who,"Error Code: Silver Anteater");
                    return;
                }
            }else{
                if(LOGLEVEL > 0) log("Weapons / params / Unrecognized parameter");
                sendMessage(getChar("Clippy"),msg.who,"Error Code: Mauve Toad");
            }
        });
        
        // Parameter Checks
        if(!shooter) return;
        if(!target) return;
        if(!weapon) return;
        
        // ---------------------------------------------------------
        
        // Determine Shooter's Aim
        // Check base aim
        let shooterAimBase = 0;
        let tempAim = getAttribute(shooter,"attribute-aim");
        if(parseInt(tempAim)) shooterAimBase = tempAim;
        else{
            if(LOGLEVEL > 0) log("Weapons / main / Shooter has no Aim");
            sendMessage(getChar("Clippy"),msg.who,"Error Code: Pink Hippo");
        }
        if(LOGLEVEL == 3) log("Weapons / main / shooter base aim: " + shooterAimBase);
        
        // Check for Aim Bonus
        let shooterAimBonus = 0;
        let tempAimBonus = getAttribute(shooter,"temp-aimBonus");
        if(parseInt(tempAimBonus)) shooterAimBonus = tempAimBonus;
        if(LOGLEVEL == 3) log("Weapons / main / shooter aim bonus: " + tempAimBonus);
        
        // Check for Aim Penalty
        let shooterAimPenalty = 0;
        let tempAimPenalty = getAttribute(shooter,"temp-aimPenalty");
        if(parseInt(tempAimPenalty)) shooterAimPenalty = tempAimPenalty;
        if(LOGLEVEL == 3) log("Weapons / main / shooter aim penalty: " + tempAimPenalty);
        
        // Calculate adjusted Aim Value
        let shooterAim = shooterAimBase + shooterAimBonus - shooterAimPenalty;
        if(LOGLEVEL == 3) log("Weapons / main / Shooter adjusted aim: " + shooterAim);
        
        // Determine Target's Defense
        // Check base defense
        let targetDefenseBase = 0;
        let tempDefenseBase = getAttribute(target,"attribute-defense");
        if(parseInt(tempDefenseBase)) targetDefenseBase = tempDefenseBase;
        if(LOGLEVEL == 3) log("Weapons / main / target base defense: " + targetDefenseBase);
        
        // Check for Defense Bonus
        let targetDefenseBonus = 0;
        let tempDefenseBonus = getAttribute(target,"temp-defenseBonus");
        if(parseInt(tempDefenseBonus)) targetDefenseBonus = tempDefenseBonus;
        if(LOGLEVEL == 3) log("Weapons / main / target defense bonus: " + targetDefenseBonus);
        
        // Check for Defense Penalty
        let targetDefensePenalty = 0;
        let tempDefensePenalty = getAttribute(shooter,"temp-defensePenalty");
        if(parseInt(tempDefensePenalty)) targetDefensePenalty = tempDefensePenalty;
        if(LOGLEVEL == 3) log("Weapons / main / target defense penalty: " + targetDefensePenalty);
        
        // Calculate adjusted Defense Value
        let targetDefense = targetDefenseBase + targetDefenseBonus - targetDefensePenalty;
        if(LOGLEVEL > 1) log("Weapons / main / Target adjusted defense: " + targetDefense);
        
        // ---------------------------------------------------------
        
        // TODO: Determine range and add to calculation
        
        // ---------------------------------------------------------
        
        // TODO: Check for crit - just use the Cover = 0 as flanking for 40 crit
        
        // ---------------------------------------------------------
        
        let toHitChance = shooterAim - targetDefense - cover + rangeMod;
        let toHitDie = randomInteger(100);
        let damage = 0;
        if(LOGLEVEL > 1) log("Weapons / main / toHitDie: " + toHitDie);
        
        let outcome = "Miss";
        if(toHitDie <= toHitChance){
            damage = weapon.damage;
            outcome = "HIT for [[" + damage + "]] damage!";
        } 
        
        let piString = "&{template:default} {{name=Perfect Information}} {{Shooter=" + shooter.get("name") + "}} " +
            "{{Target=" + target.get("name") + "}} {{Hit=" + toHitChance + "%}} {{Crit=0%}}";
            
        if(PERFECTINFORMATION) sendMessage(getChar("Clippy"),null,piString);
        
        sendMessage(shooter,null,shooter.get("name") + " fires the " + weapon.name);
        sendMessage(shooter,null,weapon.noise);
        sendMessage(shooter,null,outcome);
        
        if(LOGLEVEL > 0) log("Weapons / main / END WEAPON ------------------------------");
    }
});
