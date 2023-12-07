import { useEffect, useRef } from "react";
import * as THREE from "three";
import * as OBC from "openbim-components";
import "./App.css";
import { IfcWorker } from "./IfcWroker";

function App() {
	const containerRef = useRef<HTMLDivElement | null>(null);
	useEffect(() => {
		const components = new OBC.Components();
		initScene(components, containerRef.current!);
		return () => {
			components.dispose();
		};
	}, []);

	return <div className="full-screen" ref={containerRef}></div>;
}

function initScene(components: OBC.Components, container: HTMLDivElement) {
	components.scene = new OBC.SimpleScene(components);
	components.renderer = new OBC.PostproductionRenderer(components, container);
	components.camera = new OBC.SimpleCamera(components);
	components.raycaster = new OBC.SimpleRaycaster(components);

	components.init();

	(components.renderer as OBC.PostproductionRenderer).postproduction.enabled = true;

	(components.camera as OBC.SimpleCamera).controls.setLookAt(20, 20, 20, 0, 0, 0);

	const grid = new OBC.SimpleGrid(components, new THREE.Color(0x666666));
	components.tools.add("grid", grid);
	const customEffects = (components.renderer as OBC.PostproductionRenderer).postproduction.customEffects;
	customEffects.excludedMeshes.push(grid.get());

	const ifcWorker = new IfcWorker(components);

	const toolbar = new OBC.Toolbar(components);
	components.ui.addToolbar(toolbar);
	const loadButton = new OBC.Button(components);
	loadButton.materialIcon = "download";
	loadButton.tooltip = "Load model";
	toolbar.addChild(loadButton);
	loadButton.onClick.add(() => ifcWorker.loadModel());
}

export default App;
