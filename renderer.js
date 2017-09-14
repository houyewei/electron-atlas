// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

var rosnodejs = require('rosnodejs');

/*
int32 STAND             =  0 # stand
int32 USER              =  1 # disable AtlasSimInterface updates, rely on
                             # /atlas/atlas_command or /atlas/joint_commands
int32 FREEZE            =  2 # safety mode
int32 STAND_PREP        =  3 # stand-prep (AtlasSimInterface documentation)
int32 WALK              =  4 # multi-step walk
int32 STEP              =  5 # single step walk
int32 MANIPULATE        =  6 # stand and allows manipulation.

int32 behavior                # can be one of
                              # USER, FREEZE, STAND_PREP
                              # WALK, STEP, STAND, MANIPULATE

*/

var atlasApp = angular.module('atlasApp', ['rzModule']);
var joints = ['back_bkz', 'back_bky','back_bkx', 'neck_ry',
'l_leg_hpz','l_leg_hpx','l_leg_hpy',
'l_leg_kny',
'l_leg_aky',
'l_leg_akx',
'r_leg_hpz',
'r_leg_hpx',
'r_leg_hpy',
'r_leg_kny',
'r_leg_aky',
'r_leg_akx',
'l_arm_shz',
'l_arm_shx',
'l_arm_ely',
'l_arm_elx',
'l_arm_wry',
'l_arm_wrx',
'r_arm_shz',
'r_arm_shx',
' r_arm_ely ',
' r_arm_elx',
'r_arm_wry',
'r_arm_wrx'];
// Define the `PhoneListController` controller on the `phonecatApp` module
atlasApp.controller('atlasController', function PhoneListController($scope) {
  $scope.position = {minAge: 10, maxAge: 20};
  $scope.joints = joints;
  rosnodejs.initNode('/my_node', { onTheFly: true }).then(function (rosNode) {
    $scope.rosNode = rosNode;
    var std_msgs = rosnodejs.require('std_msgs').msg;
    var atlas = rosnodejs.require('atlas_msgs').msg;
    var ac_pub = rosNode.advertise('/atlas/atlas_command', atlas.AtlasCommand, {
      queueSize: 1,
      latching: true,
      throttleMs: 9
    })
    var sim_pub = rosNode.advertise('/atlas/atlas_sim_interface_command', atlas.AtlasSimInterfaceCommand, {
      queueSize: 1,
      latching: true,
      throttleMs: 9
    });
    var init_k_effort = [0, 0, 0 ,0, 0, 0, 0,
      0, 0, 0 ,0, 0, 0, 0,
      0, 0, 0 ,0, 0, 0, 0,
      0, 0, 0 ,0, 0, 0, 0];
    $scope.slider = {
      value: 0,
      options: {
        floor: -2,
        ceil: 2,
        step: 0.00001,
        precision: 5,
        onChange: function(id, value) {
          console.log($('.rz-active').closest('.rzslider').attr('rz-slider-options-id'), value);
          var index = $('.rz-active').closest('.rzslider').attr('rz-slider-options-id');


          var slight_movement_msg = new atlas.AtlasCommand();
          //Always insert current time
          //Start with 0.0 and set values for the joints that we want to control
          slight_movement_msg.position = $scope.pose.position;
          slight_movement_msg.position[index] = value;

          slight_movement_msg.velocity = [0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0]
          slight_movement_msg.effort = [0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0]
          slight_movement_msg.kp_position = [20.0, 4000.0, 2000.0, 20.0, 5.0, 100.0, 2000.0, 1000.0, 900.0, 300.0, 5.0, 100.0, 2000.0, 1000.0, 900.0, 300.0, 2000.0, 1000.0, 200.0, 200.0, 50.0, 100.0, 2000.0, 1000.0, 200.0, 200.0, 50.0, 100.0]
          slight_movement_msg.ki_position = [0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0]
          slight_movement_msg.kd_position = [0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0]
          // Bump up kp_velocity to reduce the jerkiness of the transition
          /*
          stand_prep_msg.kp_velocity = [50, 50, 50 ,50, 50, 50, 50,
            50, 50, 50 ,50, 50, 50, 50,
            50, 50, 50 ,50, 50, 50, 50,
            50, 50, 50 ,50, 50, 50, 50]
            */
          slight_movement_msg.i_effort_min = [0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0]
          slight_movement_msg.i_effort_max = [0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0]
          // Set k_effort = [1] for the joints that we want to control.
          // BDI has control of the other joints
          if($scope.behavior != 'manipulate') {
            init_k_effort[index] = 255
            slight_movement_msg.k_effort = init_k_effort;
          }
          //
          console.log(slight_movement_msg)
          // Publish and give time to take effect
          console.log('[USER/BDI] Command', index, value)
          ac_pub.publish(slight_movement_msg)
        }
      }
    };
    $scope.goPrep = function() {
      $scope.behavior = 'prep';

      var stand_prep_msg = new atlas.AtlasCommand();
      stand_prep_msg.position = [2.438504816382192e-05, 0.0015186156379058957,
        9.983908967114985e-06, -0.0010675729718059301, -0.0003740221436601132,
        0.06201673671603203, -0.2333149015903473, 0.5181407332420349,
        -0.27610817551612854, -0.062101610004901886, 0.00035181696875952184,
        -0.06218484416604042, -0.2332201600074768, 0.51811283826828,
        -0.2762000858783722, 0.06211360543966293, 0.29983898997306824,
        -1.303462266921997, 2.0007927417755127, 0.49823325872421265,
         0.0003098883025813848, -0.0044272784143686295, 0.29982614517211914,
          1.3034454584121704, 2.000779867172241, -0.498238742351532,
          0.0003156556049361825, 0.004448802210390568]
          stand_prep_msg.velocity = [0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0]
          stand_prep_msg.effort = [0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0,
            0, 0, 0 ,0, 0, 0, 0]
          stand_prep_msg.k_effort = [255,255,255,255,255,255,255,
          255,255,255,255,255,255,255,
          255,255,255,255,255,255,255,
          255,255,255,255,255,255,255]

      console.log('[USER] Going to stand prep position...')
      ac_pub.publish(stand_prep_msg)
      var msg = new atlas.AtlasSimInterfaceCommand();
      msg.behavior = atlas.AtlasSimInterfaceCommand.Constants.STAND_PREP;
      msg.k_effort = [255,255,255,255,255,255,255,
          255,255,255,255,255,255,255,
          255,255,255,255,255,255,255,
          255,255,255,255,255,255,255]
      console.log('[USER] Going to stand prep position...')
      console.log('[USER] Warming up BDI stand...')
      setTimeout(function() {
        sim_pub.publish(msg);
      }, 2000)
    }
    $scope.goStand = function() {
      $scope.behavior = 'stand';

      var stand_msg = new atlas.AtlasSimInterfaceCommand();
      stand_msg.behavior = atlas.AtlasSimInterfaceCommand.Constants.STAND;
      stand_msg.k_effort = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      console.log('[USER] Going to STAND')
      console.log('[USER] Warming up STAND...')
      sim_pub.publish(stand_msg);
    }
    $scope.goManipulate = function() {
      $scope.behavior = 'manipulate';

      var mani_msg = new atlas.AtlasSimInterfaceCommand();
      mani_msg.behavior = atlas.AtlasSimInterfaceCommand.Constants.MANIPULATE;
      mani_msg.k_effort = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      console.log('[USER] Going to MANIPULATE')
      console.log('[USER] Warming up MANIPULATE...')
      sim_pub.publish(mani_msg)
    }

    $scope.goWalk = function() {
      $scope.behavior = 'walk';

      var msg = new atlas.AtlasSimInterfaceCommand();
      msg.behavior = atlas.AtlasSimInterfaceCommand.Constants.WALK;
      msg.k_effort = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      console.log('[USER] Going to WALK')
      console.log('[USER] Warming up WALK...')
      sim_pub.publish(msg)
    }
    $scope.goSlightMove = function() {
      $scope.behavior = 'slightmove';

      var slight_movement_msg = new atlas.AtlasCommand();
      //Always insert current time
      //Start with 0.0 and set values for the joints that we want to control
      slight_movement_msg.position = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      slight_movement_msg.position[3] = -0.1
      slight_movement_msg.position[18] = 2.1
      slight_movement_msg.position[21] = -0.1
      slight_movement_msg.position[24] = 2.1
      slight_movement_msg.position[27] = -0.1
      slight_movement_msg.velocity = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      slight_movement_msg.effort = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      slight_movement_msg.kp_position = [20.0, 4000.0, 2000.0, 20.0, 5.0, 100.0, 2000.0, 1000.0, 900.0, 300.0, 5.0, 100.0, 2000.0, 1000.0, 900.0, 300.0, 2000.0, 1000.0, 200.0, 200.0, 50.0, 100.0, 2000.0, 1000.0, 200.0, 200.0, 50.0, 100.0]
      slight_movement_msg.ki_position = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      slight_movement_msg.kd_position = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      // Bump up kp_velocity to reduce the jerkiness of the transition
      /*
      stand_prep_msg.kp_velocity = [50, 50, 50 ,50, 50, 50, 50,
        50, 50, 50 ,50, 50, 50, 50,
        50, 50, 50 ,50, 50, 50, 50,
        50, 50, 50 ,50, 50, 50, 50]
        */
      slight_movement_msg.i_effort_min = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      slight_movement_msg.i_effort_max = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      // Set k_effort = [1] for the joints that we want to control.
      // BDI has control of the other joints
      slight_movement_msg.k_effort = [0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0,
        0, 0, 0 ,0, 0, 0, 0]
      slight_movement_msg.k_effort[3] = 255
      slight_movement_msg.k_effort[18] = 255
      slight_movement_msg.k_effort[21] = 255
      slight_movement_msg.k_effort[24] = 255
      slight_movement_msg.k_effort[27] = 255
      console.log(slight_movement_msg)
      // Publish and give time to take effect
      console.log('[USER/BDI] Command neck and arms...')
      ac_pub.publish(slight_movement_msg)
    }

    // get list of existing publishers, subscribers, and services
    rosNode._node._masterApi.getSystemState("/my_node").then(function (data) {
      //console.log("getSystemState, result", data, data.publishers);
      $scope.result = data;
      $scope.rosNode = rosNode;
      $scope.$apply();
      return data;

    })

    rosNode.subscribe('/atlas/atlas_state', 'atlas_msgs/AtlasState', function (data) {
      $scope.pose = data;
      console.log(data)
      $scope.$apply();
    }, {queueSize: 1,
      throttleMs: 1000 });

    rosNode.subscribe('/atlas/atlas_sim_interface_state', 'atlas_msgs/AtlasSimInterfaceState', function (data) {
        $scope.sim_pose = data;
        console.log(data)
        $scope.$apply();
      }, {queueSize: 1,
        throttleMs: 1000 });
  })
});
