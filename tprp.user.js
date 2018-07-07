// ==UserScript==
// @name         TagPro Respawn Pizzas
// @description  Take over the world
// @author       Ko
// @version      0.1
// @include      *.koalabeast.com:*
// @include      *.jukejuice.com:*
// @include      *.newcompte.fr:*
// @downloadURL  https://github.com/wilcooo/TagPro-RespawnPizzas/raw/master/tprp.user.js
// @supportURL   https://www.reddit.com/message/compose/?to=Wilcooo
// @website      https://redd.it/no-post-yet
// @license      MIT
// @require      https://raw.githubusercontent.com/wilcooo/TagPro-UserscriptLibrary/master/tpul.lib.js
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==


const slices = 7; // How many slices a pizza should have


tpul.settings.addSettings({
    id: 'RespawnPizzas',
    title: "Configure Respawn Pizza's",
});


/* global tagpro, PIXI */

tagpro.ready(function() {

    const elements = tagpro.renderer.dynamicSprites,
          slice = (2 * Math.PI) / slices, // The size of one pizza slice
          start = 1.5 * Math.PI; // The first slice should be at the top

    tagpro.socket.on('mapupdate', function(mapupdates){
        if (!Array.isArray(mapupdates)) mapupdates = [mapupdates];

        for (var mapupdate of mapupdates) {

            var element = elements && elements[mapupdate.x] && elements[mapupdate.x][mapupdate.y];
            if (!element) continue;

            if (mapupdate.v > 2 && String(mapupdate.v).match(/.\d1$/) ) {
                // This is a respawn warning

                if (!element.pizza) {
                    element.pizza = new PIXI.Graphics();
                    element.pizza.position.set(element.x, element.y);
                    element.parent.addChild(element.pizza);
                }

                element.mask = element.pizza;
                element.slices = 0;
                updatePizza(element);

            } else if (element.pizza) element.mask = null;
        }

    });

    function updatePizza(element){

        // Draw some pizza slices
        element.pizza.clear().beginFill().moveTo(20,20).arc(20,20,30, start, start + slice * ++element.slices);

        // Set a timer for the next slice (if ther is one)
        if (element.slices < slices) setTimeout(updatePizza, 3e3/(slices-1), element);
    }


});
