import {useLocation, useNavigate, useOutletContext, useParams} from "react-router";
import {useEffect, useRef, useState} from "react";
import {generate3DView} from "../../lib/ai.action";
import {Box, Download, RefreshCcw, Share2, X} from "lucide-react";
import {Button} from "../../components/ui/Button";
import {createProject, getProjectById} from "../../lib/puter.action";

const VisualizerId = () => {
    const {id} = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { userId } = useOutletContext<AuthContext>();
    const state = location.state as VisualizerLocationState | null;

    const hasInitialGenerated = useRef(false);

    const [project, setProject] = useState<DesignItem | null>(() => {
        if (state && id) {
            return {
                id,
                name: state.name,
                sourceImage: state.initialImage || '',
                sourcePath: state.initialImage,
                renderedPath: state.initialRender,
                timestamp: Date.now(),
            } as DesignItem;
        }
        return null;
    });
    const [isProjectLoading, setIsProjectLoading] = useState(!project);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentImage, setCurrentImage] = useState<string | null>(state?.initialRender || state?.initialImage || null);

    const handleBack = () => {
        navigate('/');
    }

    const runGeneration = async (item: DesignItem) => {
        const sourceImage = item.sourcePath || item.sourceImage;
        if (!id || !sourceImage) return;
        try{
            setIsProcessing(true);
            const result = await generate3DView({ sourceImage });

            if (result.renderedImage) {
                setCurrentImage(result.renderedImage);

                const updateditem = {
                    ...item,
                    renderedImage: result.renderedImage,
                    renderedPath: result.renderedPath,
                    timestamp: Date.now(),
                    owner: item.ownerId ?? userId ?? null,
                    isPublic: item.isPublic ?? false,
                }

                const saved = await createProject({item: updateditem, visibility: "private"})

                if (saved) {
                    setProject(saved);
                    setCurrentImage(saved.renderedPath || saved.renderedImage || result.renderedImage || null);
                }
            }
        } catch (error){
            console.error('Error generating 3D view:', error);
        } finally {
            setIsProcessing(false);
        }
    }

    useEffect(() => {
        hasInitialGenerated.current = false;
        let isMounted = true;

        const loadProject = async () => {
            if (!id) {
                setIsProjectLoading(false);
                return;
            }

            // Only show loader if we don't have initial project data
            if (!project) setIsProjectLoading(true);

            const fetchedProject = await getProjectById({ id });

            if (!isMounted) return;

            if (fetchedProject) {
                setProject(fetchedProject);
                // If we don't have a current image or it was just the source image, update it
                if (!currentImage || currentImage === fetchedProject.sourcePath || currentImage === fetchedProject.sourceImage) {
                    setCurrentImage(fetchedProject.renderedPath || fetchedProject.renderedImage || fetchedProject.sourcePath || fetchedProject.sourceImage || null);
                }
            }
            setIsProjectLoading(false);
        };

        loadProject();

        return () => {
            isMounted = false;
        };
    }, [id]);

    useEffect(() => {
        if (
            isProjectLoading ||
            hasInitialGenerated.current ||
            !(project?.sourcePath || project?.sourceImage)
        )
            return;

        if (project.renderedPath || project.renderedImage) {
            setCurrentImage(project.renderedPath || project.renderedImage || null);
            hasInitialGenerated.current = true;
            return;
        }

        hasInitialGenerated.current = true;
        void runGeneration(project);
    }, [project, isProjectLoading]);

    return (
        <div className="visualizer">
            <nav className="topbar">
                <div className="brand">
                    <Box className="logo" />
                    <span className="name">Roomify</span>
                </div>

                <Button onClick={handleBack} size="sm" variant="ghost" className="exit">
                    <X className="icon" /> Exit Editor
                </Button>
            </nav>

            <section className="content">
                <div className="panel">

                    <div className="panel-header">
                        <div className="panel-meta">
                            <p>Project</p>
                            <h2>{project?.name || `Residence ${id}`}</h2>
                            <p className='note'>Created by You</p>
                        </div>
                    </div>

                    <div className="panel-actions">
                        <Button
                            size="sm"
                            onClick={() => {}}
                            className="export"
                            disabled={!currentImage}
                        >
                            <Download className="w-4 h-4 mr-2" /> Export
                        </Button>

                        <Button
                            size="sm"
                            onClick={() => {}}
                            className="share"
                            disabled={!currentImage}
                        >
                            <Share2 className="w-4 h-4 mr-2" /> Share
                        </Button>

                    </div>

                    <div className={`render-area ${isProcessing ? 'is-processing' : ''}`}>
                        {currentImage ? (
                            <img src={currentImage} alt="AI Render"  className="render-img" />
                        ):(
                            <div className="render-placeholder">
                                {(project?.sourcePath || project?.sourceImage) && (
                                    <img src={project?.sourcePath || project?.sourceImage || ''} alt="Original Image" className="render-fallback" />
                                )}
                            </div>
                        )}

                        {isProcessing && (
                            <div className="render-overlay">
                                <div className="rendering-card">
                                    <RefreshCcw className="spinner" />
                                    <span className="title">Rendering...</span>
                                    <span className="subtitle">Generating 3D model</span>
                                </div>
                            </div>
                        )}
                    </div>


                </div>
            </section>
        </div>
    );
};

export default VisualizerId;