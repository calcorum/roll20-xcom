let importStats = "!import charId=@{character_id}"

on("ready", function(){
    on("add:character", function(char){
        createObj("attribute", {
            name: "attribute-health",
            current: 3,
            characterid: char.id
        });
        createObj("attribute", {
            name: "attribute-aim",
            current: 65,
            characterid: char.id
        });
        createObj("attribute", {
            name: "attribute-defense",
            current: 0,
            characterid: char.id
        });
        createObj("attribute", {
            name: "attribute-will",
            current: 25,
            characterid: char.id
        });
        createObj("attribute", {
            name: "attribute-hacking",
            current: 1,
            characterid: char.id
        });
        createObj("attribute", {
            name: "attribute-mobility",
            current: 15,
            characterid: char.id
        });
        
        
        createObj("ability", {
            name: "Import-Stats",
            action: importStats,
            characterid: char.id,
        });
    });
});
