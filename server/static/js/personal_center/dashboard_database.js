var helper = {
    contains: function(val, search) {
        if (Vue.util.isPlainObject(val)) {
            for (var key in val)
                if (this.contains(val[key], search))
                    return true;
        } else if (Vue.util.isArray(val)) {
            var i = val.length;
            while (i--)
                if (this.contains(val[i], search))
                    return true;
        } else if (val != null) {
            return val.toString().toLowerCase().indexOf(search) > -1;
        }
    },
};


var vDatabaseComponent = Vue.component('dashboard-database', {
    template: '#database-template',
    data    : function() {
        return {
            databaseRecords : [
            {
                id              : 0,
                title           : 'DNA and Protein 1',
                description     : 'They listened in silence. No one interrupted.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consectetur aut officia necessitatibus possimus neque vitae expedita dolor autem, reprehenderit reiciendis ad esse ab sapiente minus, inventore voluptatem molestias assumenda rerum!',
                tags            : ['Task', 'Share'],
                completeness    : 0,
                time            : 2,
            },
            {
                id              : 1,
                title           : 'DNA and Protein 2',
                description     : 'They listened in silence. No one interrupted.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consectetur aut officia necessitatibus possimus neque vitae expedita dolor autem, reprehenderit reiciendis ad esse ab sapiente minus, inventore voluptatem molestias assumenda rerum!',
                tags            : ['Public'],
                completeness    : 2,
                time            : 1,
            },
            {
                id              : 2,
                title           : 'DNA and Protein 3',
                description     : 'They listened in silence. No one interrupted.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consectetur aut officia necessitatibus possimus neque vitae expedita dolor autem, reprehenderit reiciendis ad esse ab sapiente minus, inventore voluptatem molestias assumenda rerum!',
                tags            : ['Public'],
                completeness    : 2,
                time            : 1,
            },
            {
                id              : 3,
                title           : 'DNA and Protein',
                description     : 'They listened in silence. No one interrupted.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consectetur aut officia necessitatibus possimus neque vitae expedita dolor autem, reprehenderit reiciendis ad esse ab sapiente minus, inventore voluptatem molestias assumenda rerum!',
                tags            : ['Public'],
                completeness    : 2,
                time            : 1,
            },
            {
                id              : 4,
                title           : 'DNA and Protein',
                description     : 'They listened in silence. No one interrupted.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consectetur aut officia necessitatibus possimus neque vitae expedita dolor autem, reprehenderit reiciendis ad esse ab sapiente minus, inventore voluptatem molestias assumenda rerum!',
                tags            : ['Public'],
                completeness    : 2,
                time            : 1,
            },
            {
                id              : 5,
                title           : 'DNA and Protein',
                description     : 'They listened in silence. No one interrupted.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consectetur aut officia necessitatibus possimus neque vitae expedita dolor autem, reprehenderit reiciendis ad esse ab sapiente minus, inventore voluptatem molestias assumenda rerum!',
                tags            : ['Public'],
                completeness    : 2,
                time            : 1,
            },
            {
                id              : 6,
                title           : 'DNA and Protein',
                description     : 'They listened in silence. No one interrupted.Lorem ipsum dolor sit amet, consectetur adipisicing elit. Consectetur aut officia necessitatibus possimus neque vitae expedita dolor autem, reprehenderit reiciendis ad esse ab sapiente minus, inventore voluptatem molestias assumenda rerum!',
                tags            : ['Task'],
                completeness    : 1,
                time            : 3,
            }
            ],
            favoriteRecords : [],
            currentOrder    : 'time',
            orderReverse    : true,
            orders          : ['time', 'completeness', 'Task', 'Public', 'Share'],
            editStatus      : false,
            tagData         : null,
            tagKey          : null,
            tagRev          : false,
            tagMine         : true,
            selectedRecord  : null,
            selectedTag     : 'all',
            selectedTab     : 0,
            searchTerm      : '',
        }
    },
    computed: {
        recordsBeingDisplayed: function() {
            return this.$eval('(this.tagMine ? this.databaseRecords : this.favoriteRecords)' +
                              '| recordFilterBy tagData in tagKey tagRev' +
                              '| filterBy searchTerm');
        },
    },
    ready : function() {
        $('.completeness[data-content]').popup({position: 'top center'});
    },
    methods : {
        getRecordClass: function(completeness) {
            return ['design', 'modeling', 'experiment'][completeness];
        },
        selectTag: function(tag, mine, data, key, reverse) {
            this.selectedTag = tag;
            this.tagMine = mine;
            this.tagData = data;
            this.tagKey = key;
            this.tagRev = reverse;
        },
        selectRecord: function(rec) {
            this.selectedTab = 0;
            this.selectedRecord = rec;
        },
    },
    filters : {
        recordOrderBy: function(arr, sortKey, reverse) {
            if (!sortKey)
                return arr;
            if (sortKey === 'time' || sortKey === 'completeness')
                return Vue.filter('orderBy')(arr, sortKey, reverse);
            var order = 1;
            if (arguments.length > 2) {
                if (reverse === '-1') {
                    order = -1;
                } else {
                    order = reverse ? -1 : 1;
                }
            }
            return arr.slice().sort(function (a, b) {
                var aHasTag = a.tags.indexOf(sortKey) !== -1;
                var bHasTag = b.tags.indexOf(sortKey) !== -1;
                if (aHasTag && !bHasTag) return order;
                if (!aHasTag && bHasTag) return -order;
                return a.time === b.time ? 0 : a.time > b.time ? order : -order;
            });
        },
        recordFilterBy : function (arr, search, delimiter, dataKey, reverse) {
            if (search == null)
                return arr;
            search = ('' + search).toLowerCase();
            return arr.filter(function (item) {
                return reverse ^ (dataKey ? helper.contains(item[dataKey], search) : helper.contains(item, search));
            });
        },
    },
});

