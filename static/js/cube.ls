{odd, even} = require \prelude-ls

class Cube extends Backbone.Model

    behind_mouse: 300px
    selection_distance: 300px
    width: 100px
    height: 100px
    update_interval: 5ms
    i: 0

    defaults:
        mouse: x:0px y:0px 
        mouse_distance: x:0px, y:0px, hyp:0px
        spin: vertical:20deg horizontal:0deg
        rotation: 0deg
        prev_rotation_position: -1
        rotation_position: 0
        follow: no
        selected: no

    initialize: -> 
        @add_listeners!
        setInterval @spin_cube, @update_interval
        setInterval @rotate, @update_interval

    add_listeners: -> 

        @on \change:rotation_position ->
            @set \prev_rotation_position, @previous \rotation_position

        @on \change:mouse_distance -> 
            if @get(\mouse_distance).hyp < @selection_distance then @set \selected, yes
            else @set \selected, no

        @on \change:selected -> @set \follow, @get(\selected)

    rad_to_deg: -> it * 360 / (2 * Math.PI)

    spin_cube: ~>
        if @get \follow => @follow_mouse!
        else @spin_around!

    spin_around: ~>
        spin = @get \spin

        new_spin =
            horizontal: (spin.horizontal + 0.35) % 360
            vertical: ( spin.vertical * 19 + Math.sin(Date.now()*0.5e-3) * 30 ) / 20 #(spin.vertical + 0.1) % 360

        @set \spin, new_spin

    follow_mouse: ~>

        mouse = @get \mouse
        distance = @get \mouse_distance
        spin = @get \spin

        mouse_angle =
            horizontal: @rad_to_deg Math.atan(distance.x / @behind_mouse)
            vertical: @rad_to_deg Math.atan(distance.y / @behind_mouse)

        new_spin =
            horizontal: spin.horizontal + (mouse_angle.horizontal - spin.horizontal)/50
            vertical: spin.vertical + (mouse_angle.vertical - spin.vertical)/50

        @set \spin, new_spin

    rotate: ~>
        rotation = @get(\rotation)
        rotation_position = @get(\rotation_position)
        @set \rotation, rotation + (rotation_position*90 - rotation) / 50

    rotate_left: ~>
        if @get(\rotation) < @get(\rotation_position) * 90 + 20
            @set \rotation_position, 
                @get(\rotation_position) - 1

    rotate_right: ~>
        if @get(\rotation) > @get(\rotation_position) * 90 - 20
            @set \rotation_position, 
                @get(\rotation_position) + 1



class CubeView extends Backbone.View

    el: \#cube-container

    update_interval: 5ms

    events:
        'click': -> @rotate_right!

    spin_modes:
        0: axis:\X, dir: 1
        1: axis:\Z, dir: 1
        2: axis:\X, dir: -1
        3: axis:\Z, dir: -1

    initialize: -> 
        @add_listeners!
        setInterval @update_angle, @update_interval

    add_listeners: ->
        @listenTo @model, \change:selected, @select_deselect
        $ \body .mousemove @update_mouse
        @$el.click @mouse_click
        #$ \body .click @mouse_click

    update_mouse: (mouse_event) ~>
        mouse = x: mouse_event.pageX, y: mouse_event.pageY
        x_dist = mouse.x - @$el.offset().left - @model.width/2
        y_dist = @$el.offset().top + @model.height/2 - mouse.y
        hyp_dist = Math.sqrt x_dist**2 + y_dist**2

        @model.set \mouse, mouse
        @model.set \mouse_distance, {
            x: x_dist
            y: y_dist
            hyp: hyp_dist }

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

    select_deselect: ->
        if @model.get \selected => @$(\.cube).addClass \selected
        else => @$(\.cube).removeClass \selected

    rotate_left: ~> @model.rotate_left!

    rotate_right: ~> @model.rotate_right!








$ ->

    cube = new Cube!
    cubeView = new CubeView model:cube
