// Generated by LiveScript 1.3.1
(function(){
  var Cube, CubeView;
  Cube = (function(superclass){
    var prototype = extend$((import$(Cube, superclass).displayName = 'Cube', Cube), superclass).prototype, constructor = Cube;
    prototype.behind_mouse = 1500;
    prototype.update_interval = 5;
    prototype.defaults = {
      mouse: {
        x: 0,
        y: 0
      },
      mouse_distance: {
        x: 0,
        y: 0,
        hyp: 0
      },
      spin: {
        vertical: 20,
        horizontal: 0
      },
      rotation: 0,
      prev_rotation_position: -1,
      rotation_position: 0
    };
    prototype.initialize = function(){
      this.add_listeners();
      setInterval(this.follow_mouse, this.update_interval);
      return setInterval(this.rotate, this.update_interval);
    };
    prototype.add_listeners = function(){
      return this.on('change:rotation_position', function(){
        return this.set('prev_rotation_position', this.previous('rotation_position'));
      });
    };
    prototype.rad_to_deg = function(it){
      return it * 360 / (2 * Math.PI);
    };
    prototype.deg_to_rad = function(it){
      return it * 2 * Math.PI / 360;
    };
    prototype.spin_around = function(){
      var spin, new_spin;
      spin = this.get('spin');
      new_spin = {
        horizontal: (spin.horizontal + 0.35) % 360,
        vertical: (spin.vertical * 99 + Math.sin(Date.now() * 0.5e-3) * 30) / 100
      };
      return this.set('spin', new_spin);
    };
    prototype.follow_mouse = function(){
      var mouse, distance, spin, mouse_angle, new_spin;
      mouse = this.get('mouse');
      distance = this.get('mouse_distance');
      spin = this.get('spin');
      mouse_angle = {
        horizontal: this.rad_to_deg(Math.atan(distance.x / this.behind_mouse)),
        vertical: this.rad_to_deg(Math.atan(distance.y / this.behind_mouse))
      };
      new_spin = {
        horizontal: spin.horizontal + (mouse_angle.horizontal - spin.horizontal + 45) / 50,
        vertical: spin.vertical + (mouse_angle.vertical - spin.vertical - 45) / 50
      };
      return this.set('spin', new_spin);
    };
    prototype.rotate = function(){
      var rotation, rotation_position;
      rotation = this.get('rotation');
      rotation_position = this.get('rotation_position');
      return this.set('rotation', rotation + (rotation_position * 90 - rotation) / 50);
    };
    prototype.rotate_left = function(){
      if (this.get('rotation') < this.get('rotation_position') * 90 + 10) {
        return this.set('rotation_position', this.get('rotation_position') - 1);
      }
    };
    prototype.rotate_right = function(){
      if (this.get('rotation') > this.get('rotation_position') * 90 - 10) {
        return this.set('rotation_position', this.get('rotation_position') + 1);
      }
    };
    function Cube(){
      this.rotate_right = bind$(this, 'rotate_right', prototype);
      this.rotate_left = bind$(this, 'rotate_left', prototype);
      this.rotate = bind$(this, 'rotate', prototype);
      this.follow_mouse = bind$(this, 'follow_mouse', prototype);
      this.spin_around = bind$(this, 'spin_around', prototype);
      Cube.superclass.apply(this, arguments);
    }
    return Cube;
  }(Backbone.Model));
  CubeView = (function(superclass){
    var prototype = extend$((import$(CubeView, superclass).displayName = 'CubeView', CubeView), superclass).prototype, constructor = CubeView;
    prototype.el = '#cube-container';
    prototype.update_interval = 5;
    prototype.events = {
      'click .cube': function(){
        this.$('.click-me').removeClass('show');
        return this.rotate_right();
      }
    };
    prototype.spin_modes = {
      0: {
        axis: 'X',
        dir: 1
      },
      1: {
        axis: 'Z',
        dir: 1
      },
      2: {
        axis: 'X',
        dir: -1
      },
      3: {
        axis: 'Z',
        dir: -1
      }
    };
    prototype.initialize = function(){
      this.modernizr_fallback();
      this.add_listeners();
      return setInterval(this.update_angle, this.update_interval);
    };
    prototype.modernizr_fallback = function(){
      var is_device, is_ie, is_firefox;
      is_device = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      is_ie = /MSIE/.test(navigator.userAgent);
      if (is_device || is_ie || !Modernizr.preserve3d) {
        this.$el.html('<img class="fallback-logo" src="/img/cube-logo.png"/>');
      }
      return is_firefox = /Firefox/.test(navigator.userAgent);
    };
    prototype.add_listeners = function(){
      var this$ = this;
      $('body').mousemove(this.update_mouse);
      return $('body').one('mousemove', function(){
        return this$.$('.click-me').addClass('show');
      });
    };
    prototype.update_mouse = function(mouse_event){
      var mouse, x$, x_dist, y_dist, hyp_dist;
      mouse = {
        x: mouse_event.pageX,
        y: mouse_event.pageY
      };
      x$ = this.el.getBoundingClientRect();
      x_dist = mouse.x - x$.left - x$.width / 2;
      y_dist = x$.top + x$.height / 2 - mouse.y;
      hyp_dist = Math.sqrt(Math.pow(x_dist, 2) + Math.pow(y_dist, 2));
      this.model.set('mouse', mouse);
      return this.model.set('mouse_distance', {
        x: x_dist,
        y: y_dist,
        hyp: hyp_dist
      });
    };
    prototype.round = function(n){
      return parseFloat(n.toFixed(5));
    };
    prototype.update_angle = function(){
      var rotation, rotation_position, prev_rotation_position, spin, spin_mode, ref$, prev_spin_mode, percent_complete, main_vertical_angle, secondary_vertical_angle, horizontal_rotation_css, main_vertical_rotation_css, secondary_vertical_rotation_css;
      rotation = this.model.get('rotation');
      rotation_position = this.model.get('rotation_position');
      prev_rotation_position = this.model.get('prev_rotation_position');
      spin = this.model.get('spin');
      spin_mode = this.spin_modes[(((rotation_position) % (ref$ = 4) + ref$) % ref$)];
      prev_spin_mode = this.spin_modes[(((prev_rotation_position) % (ref$ = 4) + ref$) % ref$)];
      percent_complete = Math.abs((rotation - prev_rotation_position * 90) / 90);
      main_vertical_angle = this.round(percent_complete * spin.vertical);
      secondary_vertical_angle = this.round((1 - percent_complete) * spin.vertical);
      horizontal_rotation_css = "rotateY(" + (rotation + spin.horizontal) + "deg)";
      main_vertical_rotation_css = "rotate" + spin_mode.axis + "(" + spin_mode.dir * main_vertical_angle + "deg)";
      secondary_vertical_rotation_css = "rotate" + prev_spin_mode.axis + "(" + prev_spin_mode.dir * secondary_vertical_angle + "deg)";
      this.$('.cube').css({
        'transform': horizontal_rotation_css + main_vertical_rotation_css + secondary_vertical_rotation_css
      });
      return this.$('.cube').css({
        '-webkit-transform': horizontal_rotation_css + main_vertical_rotation_css + secondary_vertical_rotation_css
      });
    };
    prototype.rotate_left = function(){
      return this.model.rotate_left();
    };
    prototype.rotate_right = function(){
      return this.model.rotate_right();
    };
    function CubeView(){
      this.rotate_right = bind$(this, 'rotate_right', prototype);
      this.rotate_left = bind$(this, 'rotate_left', prototype);
      this.update_angle = bind$(this, 'update_angle', prototype);
      this.update_mouse = bind$(this, 'update_mouse', prototype);
      CubeView.superclass.apply(this, arguments);
    }
    return CubeView;
  }(Backbone.View));
  $(function(){
    window.cube = new Cube();
    return window.cubeView = new CubeView({
      model: window.cube
    });
  });
  function bind$(obj, key, target){
    return function(){ return (target || obj)[key].apply(obj, arguments) };
  }
  function extend$(sub, sup){
    function fun(){} fun.prototype = (sub.superclass = sup).prototype;
    (sub.prototype = new fun).constructor = sub;
    if (typeof sup.extended == 'function') sup.extended(sub);
    return sub;
  }
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);
