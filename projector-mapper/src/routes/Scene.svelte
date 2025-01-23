<script lang="ts">
  import { T } from '@threlte/core'
  import * as THREE from 'three'
  let camera:  THREE.OrthographicCamera;
  // const renderer = new THREE.WebGLRenderer();
  const frustumSize = 100;
  // renderer.setPixelRatio( window.devicePixelRatio );
  // renderer.setSize( window.innerWidth, window.innerHeight );
  // document.body.appendChild( renderer.domElement );  
  
  // T.setPixelRatio(window.devicePixelRatio);
  // T.setSize(window.innerWidth, window.innerHeight);
  function onWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;

    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;

    camera.updateProjectionMatrix();

    // renderer.setSize( window.innerWidth, window.innerHeight );
}
addEventListener( 'resize', onWindowResize );
</script>


<T.Mesh position={[0, 100, 0]}>
  <T.PlaneGeometry args={[100, 100]} />
  <T.MeshBasicMaterial color="red" />
</T.Mesh>

<T.OrthographicCamera
  bind:ref={camera} 
  position={[0, 0, 10]}  
  makeDefault
  onCreated={(ref:THREE.OrthographicCamera) => {
    ref.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
  }}
/>