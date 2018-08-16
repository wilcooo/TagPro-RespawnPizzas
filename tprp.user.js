// ==UserScript==
// @name         TagPro Respawn Pizzas
// @description  Replace Respawn Warnings by a "growing pizza animation" to know exactly when the respawn happens!
// @author       Ko
// @version      1.1
// @include      *.koalabeast.com*
// @include      *.jukejuice.com*
// @include      *.newcompte.fr*
// @downloadURL  https://github.com/wilcooo/TagPro-RespawnPizzas/raw/master/tprp.user.js
// @icon         https://github.com/wilcooo/TagPro-RespawnPizzas/raw/master/icon.png
// @supportURL   https://www.reddit.com/message/compose/?to=Wilcooo
// @website      https://redd.it/no-post-yet
// @license      MIT
// @require      https://greasyfork.org/scripts/371240/code/TagPro%20Userscript%20Library.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_xmlhttpRequest
// @connect      koalabeast.com
// ==/UserScript==








// =====SETTINGS SECTION=====


// I use tpul for this userscripts' options.
// see: https://github.com/wilcooo/TagPro-UserscriptLibrary

var settings = tpul.settings.addSettings({
    id: 'RespawnPizzas',
    title: "Configure Respawn Pizza's",
    tooltipText: "Respawn Pizza's",
    icon: "https://github.com/wilcooo/TagPro-RespawnPizzas/raw/master/icon.png",


    fields: {
        slices: {
            label: 'Slices',
            section: ['','Tip: set this to 180 if you want it to grow gradually.'],
            type: 'int',
            min: 2,
            max: 180,
            default: 7,
        },
        tp_warnings: {
            label: 'Tile Respawn Warnings:',
            section: ['','This next option is the same as on your profile page. A refresh is required after updating it.'],
            type: 'select',
            options: ['Blink','Transparant','None'],
            default: 'Transparant',
            save: false, // We have defined a custom way of storing/retrieving this.
        },
    },


    events: {
        save: function(){
            // This function will be called after a successful save

            // Update the slices setting directly, no refresh required!
            // TODO: check if this works. Might need to be asynchronous.
            slices = settings.get('slices');

            // Save the tp_warnings value (to the cookies, using tpul)
            var selected_value = settings.fields.tp_warnings.node.value,
                setting_value = {Blink: 'blink', Transparant: 'alpha', None: 'none'}[selected_value];

            tpul.profile.setSettings({ tileRespawnWarnings: setting_value });
        },
        open: function(){
            // This function will be called upon opening the settings

            // Set the tp_warnings field to the right value (it's in the cookies)
            var setting_value = /(?:^|;)\s*tileRespawnWarnings\s*=\s*(.*?)\s*(?:;|$)/.exec(document.cookie)[1],
                selected_value = {blink: 'Blink', alpha: 'Transparant', none: 'None'}[setting_value];

            settings.fields.tp_warnings.node.value = selected_value;
        },
    }
});

var slices = settings.get('slices');










// =====LOGIC SECTION=====


if (location.port) {

    tagpro.ready(function() {

        const elements = tagpro.renderer.dynamicSprites,
              start = 1.5 * Math.PI; // The first slice should be at the top

        // Listen for respawn warnings...
        tagpro.socket.on('mapupdate', function(mapupdates){
            if (!Array.isArray(mapupdates)) mapupdates = [mapupdates];

            for (var mapupdate of mapupdates) {

                var element = elements && elements[mapupdate.x] && elements[mapupdate.x][mapupdate.y];
                if (!element) continue;

                if (mapupdate.v > 2 && String(mapupdate.v).match(/.\d1$/) ) {
                    // We got a respawn warning!

                    // Bake a new pizza if it's the first time
                    if (!element.pizza) {
                        element.pizza = new PIXI.Graphics();
                        element.pizza.position.set(element.x, element.y);
                        element.parent.addChild(element.pizza);
                    }

                    // Reset the pizza
                    element.mask = element.pizza;
                    element.slices = 0;
                    element.warning = performance.now();

                    // Let it grow!
                    updatePizza(element);

                } else if (element.pizza) element.mask = null; // <<-- Hide the pizza once respawned.
            }

        });

        function updatePizza(element){ // Adds a slice

            var portion = ++element.slices * (2 * Math.PI / slices);

            // Draw the pizza!
            element.pizza.clear().beginFill().moveTo(20,20).arc(20,20,30, start, start+portion );

            // Set a timer for the next slice (if there is one)
            if (element.slices < slices) setTimeout(
                updatePizza,
                ( element.warning + 3e3 * element.slices / (slices-1) ) - performance.now(),
                element);
        }


    });
}










/* TODO:

Try updating the respawn warning type on the fly:

look at tagpro._readyCallbacks soon enough, to find the function that modifies tagpro.tiles.
I think when calling that again it will update everything. It might break things though.

*/
