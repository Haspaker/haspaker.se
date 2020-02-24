class Cube extends Backbone.Model

    behind_mouse: 1500px
    update_interval: 5ms

    defaults:
        mouse: x:0px y:0px 
        mouse_distance: x:0px, y:0px, hyp:0px
        spin: vertical:20deg horizontal:0deg
        rotation: 0deg
        prev_rotation_position: -1
        rotation_position: 0

    initialize: -> 
        @add_listeners!
        setInterval @follow_mouse, @update_interval
        setInterval @rotate, @update_interval

    add_listeners: -> 

        @on \change:rotation_position ->
            @set \prev_rotation_position, @previous \rotation_position

    rad_to_deg: -> it * 360 / (2 * Math.PI)
    deg_to_rad: -> it * 2 * Math.PI / 360

    spin_around: ~>
        spin = @get \spin

        new_spin =
            horizontal: (spin.horizontal + 0.35) % 360
            vertical: ( spin.vertical * 99 + Math.sin(Date.now()*0.5e-3) * 30 ) / 100

        @set \spin, new_spin

    follow_mouse: ~>

        mouse = @get \mouse
        distance = @get \mouse_distance
        spin = @get \spin

        mouse_angle =
            horizontal: @rad_to_deg Math.atan(distance.x / @behind_mouse)
            vertical: @rad_to_deg Math.atan(distance.y / @behind_mouse)

        new_spin =
            horizontal: spin.horizontal + (mouse_angle.horizontal - spin.horizontal + 45)/50
            vertical: spin.vertical + (mouse_angle.vertical - spin.vertical - 45)/50

        @set \spin, new_spin

    rotate: ~>
        rotation = @get(\rotation)
        rotation_position = @get(\rotation_position)
        @set \rotation, rotation + (rotation_position*90 - rotation) / 50

    rotate_left: ~>
        if @get(\rotation) < @get(\rotation_position) * 90 + 10
            @set \rotation_position, 
                @get(\rotation_position) - 1

    rotate_right: ~>
        if @get(\rotation) > @get(\rotation_position) * 90 - 10
            @set \rotation_position, 
                @get(\rotation_position) + 1



class CubeView extends Backbone.View

    el: \#cube-container

    update_interval: 5ms

    events:
        'click .cube': -> 
           @$ \.click-me .removeClass \show
           @rotate_right!

    spin_modes:
        0: axis:\X, dir: 1
        1: axis:\Z, dir: 1
        2: axis:\X, dir: -1
        3: axis:\Z, dir: -1

    initialize: -> 
        @modernizr_fallback!
        @add_listeners!
        setInterval @update_angle, @update_interval

    modernizr_fallback: ->
        is_device = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test navigator.userAgent
        is_ie = /MSIE/.test navigator.userAgent
        if is_device or is_ie or not Modernizr.preserve3d
            @$el.html '<img class="fallback-logo" src="/img/cube-logo.png"/>'
        is_firefox = /Firefox/.test navigator.userAgent
        #if is_firefox
        #    @$el.addClass \firefox

    add_listeners: ->
        $ \body .mousemove @update_mouse
        $ \body .one \mousemove ~> @$ \.click-me .addClass \show

    update_mouse: (mouse_event) ~>
        mouse = x: mouse_event.pageX, y: mouse_event.pageY
        with @el.getBoundingClientRect()
            x_dist = mouse.x - ..left - ..width/2
            y_dist = ..top + ..height/2 - mouse.y
        hyp_dist = Math.sqrt x_dist**2 + y_dist**2

        @model.set \mouse, mouse
        @model.set \mouse_distance, do
            x: x_dist
            y: y_dist
            hyp: hyp_dist

    round: (n) -> parseFloat(n.toFixed(5))

    update_angle: ~>

        rotation = @model.get \rotation
        rotation_position = @model.get \rotation_position
        prev_rotation_position = @model.get \prev_rotation_position

        spin = @model.get \spin
        spin_mode = @spin_modes[rotation_position %% 4]
        prev_spin_mode = @spin_modes[prev_rotation_position %% 4]

        percent_complete = Math.abs (rotation - (prev_rotation_position) * 90) / 90
        main_vertical_angle = @round percent_complete * spin.vertical
        secondary_vertical_angle = @round (1 - percent_complete) * spin.vertical

        horizontal_rotation_css = "rotateY(#{rotation + spin.horizontal}deg)"
        main_vertical_rotation_css = "rotate#{spin_mode.axis}(#{spin_mode.dir * main_vertical_angle}deg)"
        secondary_vertical_rotation_css = "rotate#{prev_spin_mode.axis}(#{prev_spin_mode.dir * secondary_vertical_angle}deg)"

        @$(\.cube).css 'transform': 
            horizontal_rotation_css + main_vertical_rotation_css + secondary_vertical_rotation_css
        @$(\.cube).css '-webkit-transform': 
            horizontal_rotation_css + main_vertical_rotation_css + secondary_vertical_rotation_css

    rotate_left: ~> @model.rotate_left!

    rotate_right: ~> @model.rotate_right!

$ ->

    window.cube = new Cube!
    window.cubeView = new CubeView model: window.cube
