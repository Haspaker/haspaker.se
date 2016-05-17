// Generated by LiveScript 1.3.1
(function(){
  var Page, PageView, LandingPageView, SkillsPageView, Navigation, NavigationView, Site, SiteView;
  import$(window, require('prelude-ls'));
  Page = (function(superclass){
    var prototype = extend$((import$(Page, superclass).displayName = 'Page', Page), superclass).prototype, constructor = Page;
    prototype.title = null;
    prototype.view = PageView;
    prototype.defaults = {
      active: false
    };
    prototype.activate = function(){
      return this.set('active', true);
    };
    prototype.deactivate = function(){
      return this.set('active', false);
    };
    function Page(){
      Page.superclass.apply(this, arguments);
    }
    return Page;
  }(Backbone.Model));
  PageView = (function(superclass){
    var prototype = extend$((import$(PageView, superclass).displayName = 'PageView', PageView), superclass).prototype, constructor = PageView;
    prototype.initialize = function(){
      this.listenTo(this.model, 'change:active', this.show_hide);
      this.listenTo(this.model, 'change:active', this.set_title);
      if (this.model.get('active')) {
        return this.show();
      }
    };
    prototype.show_hide = function(){
      if (this.model.get('active')) {
        return this.show();
      } else {
        return this.hide();
      }
    };
    prototype.show = function(){
      return this.$el.fadeIn();
    };
    prototype.hide = function(){
      return this.$el.stop().hide();
    };
    prototype.set_title = function(){
      if (this.title && this.model.get('active')) {
        return document.title = this.title;
      }
    };
    function PageView(){
      this.set_title = bind$(this, 'set_title', prototype);
      PageView.superclass.apply(this, arguments);
    }
    return PageView;
  }(Backbone.View));
  LandingPageView = (function(superclass){
    var prototype = extend$((import$(LandingPageView, superclass).displayName = 'LandingPageView', LandingPageView), superclass).prototype, constructor = LandingPageView;
    prototype.el = 'section.landing';
    prototype.title = "Hannes Aspåker";
    prototype.events = function(){
      return {
        'click .view-portfolio': this.scroll_to_portfolio,
        'click .go-back': this.hide_portfolio
      };
    };
    prototype.initialize = function(){
      var this$ = this;
      superclass.prototype.initialize.apply(this, arguments);
      $('.page-label.selected').click(function(){
        var x$;
        x$ = this$.$('.view-portfolio .alert');
        x$.removeClass('pulse');
        setTimeout(function(){
          return x$.addClass('pulse');
        }, 5);
        return x$;
      });
      this.resize_greeting();
      return $(window).resize(this.resize_greeting);
    };
    prototype.resize_greeting = function(){
      var $greeting, height;
      $greeting = this.$('.greeting');
      $greeting.css({
        height: 'auto'
      });
      height = Math.max($greeting.height(), $(window).height() - $greeting.offset().top);
      $greeting.css({
        height: height
      });
      if (window.location.hash === '#portfolio') {
        return $(window).scrollTo(this.$('.portfolio'));
      }
    };
    prototype.show = function(){
      var x$;
      x$ = window.navigation;
      if (x$.previous("page_index") === 0) {
        this.$el.show();
      } else {
        superclass.prototype.show.apply(this, arguments);
      }
      if (window.location.hash === '#portfolio') {
        return this.scroll_to_portfolio();
      }
    };
    prototype.scroll_to_portfolio = function(){
      return $(window).scrollTo(this.$('.portfolio'), 500, function(){
        return window.location.hash = '#portfolio';
      });
    };
    prototype.hide_portfolio = function(){
      return $(window).scrollTo(0, 500, function(){
        return window.location.hash = '#';
      });
    };
    function LandingPageView(){
      this.resize_greeting = bind$(this, 'resize_greeting', prototype);
      LandingPageView.superclass.apply(this, arguments);
    }
    return LandingPageView;
  }(PageView));
  SkillsPageView = (function(superclass){
    var prototype = extend$((import$(SkillsPageView, superclass).displayName = 'SkillsPageView', SkillsPageView), superclass).prototype, constructor = SkillsPageView;
    prototype.el = 'section.skills';
    prototype.title = "Hannes Aspåker | Skills";
    function SkillsPageView(){
      SkillsPageView.superclass.apply(this, arguments);
    }
    return SkillsPageView;
  }(PageView));
  Navigation = (function(superclass){
    var prototype = extend$((import$(Navigation, superclass).displayName = 'Navigation', Navigation), superclass).prototype, constructor = Navigation;
    prototype.defaults = {
      page_index: 0
    };
    prototype.pages = [Page, Page];
    prototype.hashlinks = {
      '': 0,
      'portfolio': 0,
      'skills': 1
    };
    prototype.initialize = function(){
      this.pages = map((function(it){
        return new it;
      }))(this.pages);
      this.hashlink();
      this.change_page();
      window.onhashchange = this.hashlink;
      this.on('change:page_index', this.change_page);
      return this.on('change:page_index', this.update_hash);
    };
    prototype.change_page = function(){
      var index;
      index = this.get('page_index');
      this.pages.map(function(it){
        return it.deactivate();
      });
      return this.pages[index].activate();
    };
    prototype.hashlink = function(){
      var hash;
      hash = /^#/.exec(location.hash) ? tail(location.hash) : '';
      if (in$(hash, keys(this.hashlinks))) {
        return this.set('page_index', this.hashlinks[hash]);
      }
    };
    prototype.update_hash = function(){
      var index;
      index = this.get('page_index');
      return window.location.hash = keys(this.hashlinks)[elemIndex(index, values(this.hashlinks))];
    };
    function Navigation(){
      this.update_hash = bind$(this, 'update_hash', prototype);
      this.hashlink = bind$(this, 'hashlink', prototype);
      Navigation.superclass.apply(this, arguments);
    }
    return Navigation;
  }(Backbone.Model));
  NavigationView = (function(superclass){
    var prototype = extend$((import$(NavigationView, superclass).displayName = 'NavigationView', NavigationView), superclass).prototype, constructor = NavigationView;
    prototype.el = '.navigation';
    prototype.events = {
      'click .pages .page-label': function(e){
        return this.select_page($(e.target).index());
      }
    };
    prototype.pages = [LandingPageView, SkillsPageView];
    prototype.initialize = function(){
      var i$, ref$, len$, i, page_model, page_index;
      for (i$ = 0, len$ = (ref$ = this.model.pages).length; i$ < len$; ++i$) {
        i = i$;
        page_model = ref$[i$];
        this.pages[i] = new this.pages[i]({
          model: page_model
        });
      }
      page_index = this.model.get('page_index');
      this.listenTo(this.model, 'change:page_index', this.move_arrow);
      this.listenTo(this.model, 'change:page_index', this.render);
      return this.render();
    };
    prototype.get_selected_page_label = function(){
      var page_index, label_index;
      page_index = this.model.get('page_index');
      label_index = page_index + 1;
      return this.$(".page-label:nth-child(" + label_index + ")");
    };
    prototype.render = function(){
      this.$('.page-label').removeClass('selected');
      return this.get_selected_page_label().addClass('selected');
    };
    prototype.select_page = function(index){
      return this.model.set('page_index', index);
    };
    function NavigationView(){
      NavigationView.superclass.apply(this, arguments);
    }
    return NavigationView;
  }(Backbone.View));
  Site = (function(superclass){
    var prototype = extend$((import$(Site, superclass).displayName = 'Site', Site), superclass).prototype, constructor = Site;
    function Site(){
      Site.superclass.apply(this, arguments);
    }
    return Site;
  }(Backbone.Model));
  SiteView = (function(superclass){
    var prototype = extend$((import$(SiteView, superclass).displayName = 'SiteView', SiteView), superclass).prototype, constructor = SiteView;
    function SiteView(){
      SiteView.superclass.apply(this, arguments);
    }
    return SiteView;
  }(Backbone.View));
  $(function(){
    var siteView, navigationView;
    window.site = new Site();
    window.navigation = new Navigation();
    siteView = new SiteView({
      model: window.site
    });
    return navigationView = new NavigationView({
      model: window.navigation
    });
  });
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
  function extend$(sub, sup){
    function fun(){} fun.prototype = (sub.superclass = sup).prototype;
    (sub.prototype = new fun).constructor = sub;
    if (typeof sup.extended == 'function') sup.extended(sub);
    return sub;
  }
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);