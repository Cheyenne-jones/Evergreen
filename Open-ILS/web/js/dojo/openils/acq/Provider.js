/* ---------------------------------------------------------------------------
 * Copyright (C) 2008  Georgia Public Library Service
 * Bill Erickson <erickson@esilibrary.com>
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License
 * as published by the Free Software Foundation; either version 2
 * of the License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * ---------------------------------------------------------------------------
 */

if(!dojo._hasResource['openils.acq.Provider']) {
dojo._hasResource['openils.acq.Provider'] = true;
dojo.provide('openils.acq.Provider');
dojo.require('fieldmapper.Fieldmapper');
dojo.require('fieldmapper.dojoData');

/** Declare the Provider class with dojo */
dojo.declare('openils.acq.Provider', null, {
    /* add instance methods here if necessary */
});

openils.acq.Provider.cache = {};

/* define some static provider methods ------- */

openils.acq.Provider.createStore = function(onComplete, limitPerm) {
    /** Fetches the list of funding_sources and builds a grid from them */

    function mkStore(r) {
        var msg;
        var items = [];
        while(msg = r.recv()) {
            var provider = msg.content();
            openils.acq.Provider.cache[provider.id()] = provider;
            items.push(provider);
        }
        onComplete(acqpro.toStoreData(items));
    }

    fieldmapper.standardRequest(
        ['open-ils.acq', 'open-ils.acq.provider.org.retrieve'],
        {   async: true,
            params: [openils.User.authtoken],
            oncomplete: mkStore
        }
    );
};


/**
 * Synchronous provider retrievel method 
 */
openils.acq.Provider.retrieve = function(id) {
    if(openils.acq.Provider.cache[id])
        return openils.acq.Provider.cache[id];

    openils.acq.Provider.cache[id] = 
        fieldmapper.standardRequest(
            ['open-ils.acq', 'open-ils.acq.provider.retrieve'],
            [openils.User.authtoken, id]
        );
    return openils.acq.Provider.cache[id];
};


openils.acq.Provider.retrieveLineitemProviderAttrDefs = function(providerId, oncomplete) {
    fieldmapper.standardRequest(
        ['open-ils.acq', 'open-ils.acq.lineitem_provider_attr_definition.provider.retrieve.atomic'],
        {   async: true,
            params: [openils.User.authtoken, providerId],
            oncomplete: function(r) {oncomplete(r.recv().content());}
        }
    );
}

openils.acq.Provider.createLineitemProviderAttrDef = function(fields, oncomplete) {
    var attr = new acqlipad();
    for(var field in fields) 
        attr[field](fields[field]);

    fieldmapper.standardRequest(
        ['open-ils.acq', 'open-ils.acq.lineitem_provider_attr_definition.create'],
        {   async: true,
            params: [openils.User.authtoken, attr],
            oncomplete: function(r) {oncomplete(r.recv().content());}
        }
    );
}


openils.acq.Provider.lineitemProviderAttrDefDeleteList = function(list, oncomplete) {
    openils.acq.Provider._lineitemProviderAttrDefDeleteList(list, 0, oncomplete);
}

openils.acq.Provider._lineitemProviderAttrDefDeleteList = function(list, idx, oncomplete) {
    if(idx >= list.length)
        return oncomplete();
    fieldmapper.standardRequest(
        ['open-ils.acq', 'open-ils.acq.lineitem_provider_attr_definition.delete'],
        {   async: true,
            params: [openils.User.authtoken, list[idx]],
            oncomplete: function(r) {
                msg = r.recv()
                stat = msg.content();
                /* XXX CHECH FOR EVENT */
                openils.acq.Provider._lineitemProviderAttrDefDeleteList(list, ++idx, oncomplete);
            }
        }
    );
}

}
