import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { FullscreenImageCarousel } from "../../src/fullscreen-image-carousel";

// =============================================================================
// UNIT TESTS
// =============================================================================
describe("Fullscreen Image Carousel", () => {
    beforeEach(() => {
        jest.clearAllMocks();

        // have to mock as it's not implemented in jsdom
        window.HTMLElement.prototype.scrollIntoView = jest.fn();

        global.ResizeObserver = jest.fn().mockImplementation(() => ({
            observe: jest.fn(),
            unobserve: jest.fn(),
            disconnect: jest.fn(),
        }));
    });

    it("should render the component", () => {
        render(<FullscreenImageCarousel items={IMAGES} show={true} />);

        expect(screen.getByTestId("image-carousel-modal")).toBeInTheDocument();
        expect(screen.queryByTestId("delete-btn")).not.toBeInTheDocument();

        const slides = screen.getAllByTestId("slide-item");
        expect(slides.length).toBe(4);
        const thumbnails = screen.getAllByTestId("thumbnail-item");
        expect(thumbnails.length).toBe(4);
    });

    it("should render the delete button and call onDelete with the current item and index", () => {
        const onDelete = jest.fn();

        render(
            <FullscreenImageCarousel
                items={IMAGES}
                show={true}
                onDelete={onDelete}
            />
        );

        expect(screen.getByTestId("delete-btn")).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("forward-btn"));
        expect(screen.getByText("2/4")).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("delete-btn"));

        expect(onDelete).toHaveBeenCalledWith(IMAGES[1], 1);
    });

    it("should display the correct slide current based on the initialIndex", () => {
        render(
            <FullscreenImageCarousel
                items={IMAGES}
                show={true}
                initialActiveItemIndex={1}
            />
        );

        expect(screen.getByText("2/4")).toBeInTheDocument();
    });

    it("should clamp the current slide when items shrink", async () => {
        const { rerender } = render(
            <FullscreenImageCarousel
                items={IMAGES}
                show={true}
                initialActiveItemIndex={3}
            />
        );

        expect(screen.getByText("4/4")).toBeInTheDocument();

        rerender(
            <FullscreenImageCarousel
                items={IMAGES.slice(0, 3)}
                show={true}
                initialActiveItemIndex={3}
            />
        );

        await waitFor(() => {
            expect(screen.getByText("3/3")).toBeInTheDocument();
        });
    });

    describe("Navigation", () => {
        it("should navigate to the correct slide when arrow buttons are clicked", async () => {
            render(<FullscreenImageCarousel items={IMAGES} show={true} />);
            expect(screen.getByText("1/4")).toBeInTheDocument();

            fireEvent.click(screen.getByTestId("forward-btn"));
            expect(screen.getByText("2/4")).toBeInTheDocument();

            fireEvent.click(screen.getByTestId("prev-btn"));
            expect(screen.getByText("1/4")).toBeInTheDocument();
        });

        it("should navigate to the correct slide when thumbnail is clicked", async () => {
            render(<FullscreenImageCarousel items={IMAGES} show={true} />);

            const elements = screen.getAllByTestId("thumbnail-item");

            fireEvent.click(elements[1]);
            expect(screen.getByText("2/4")).toBeInTheDocument();

            fireEvent.click(elements[0]);
            expect(screen.getByText("1/4")).toBeInTheDocument();
        });
    });

    describe("File info bar", () => {
        it("should render fileName and fileSize when provided on the current item", () => {
            render(
                <FullscreenImageCarousel
                    items={IMAGES_WITH_FILE_INFO}
                    show={true}
                />
            );

            expect(screen.getByText("photo-a.jpg")).toBeInTheDocument();
            expect(screen.getByText("1.2 MB")).toBeInTheDocument();
        });

        it("should not render the file info bar when no item has fileName or fileSize", () => {
            render(<FullscreenImageCarousel items={IMAGES} show={true} />);

            expect(screen.queryByText(/\.jpg|MB|KB/)).not.toBeInTheDocument();
        });

        it("should not render file info text for a slide that has no fileName or fileSize", () => {
            render(
                <FullscreenImageCarousel
                    items={IMAGES_WITH_FILE_INFO}
                    show={true}
                    initialActiveItemIndex={3}
                />
            );

            // Slide 3 has no file info; bar is present but no text
            expect(screen.queryByText("photo-a.jpg")).not.toBeInTheDocument();
            expect(screen.queryByText("photo-b.jpg")).not.toBeInTheDocument();
        });

        it("should update the file info bar when navigating to a different slide", () => {
            render(
                <FullscreenImageCarousel
                    items={IMAGES_WITH_FILE_INFO}
                    show={true}
                />
            );

            expect(screen.getByText("photo-a.jpg")).toBeInTheDocument();

            fireEvent.click(screen.getByTestId("forward-btn"));

            expect(screen.queryByText("photo-a.jpg")).not.toBeInTheDocument();
            expect(screen.getByText("photo-b.jpg")).toBeInTheDocument();
            expect(screen.getByText("840 KB")).toBeInTheDocument();
        });

        it("should display '-' as the file name when only fileSize is provided", () => {
            render(
                <FullscreenImageCarousel
                    items={IMAGES_WITH_FILE_INFO}
                    show={true}
                    initialActiveItemIndex={2}
                />
            );

            expect(screen.getByText("-")).toBeInTheDocument();
            expect(screen.getByText("500 KB")).toBeInTheDocument();
        });

        it("should render fileName only when fileSize is not provided", () => {
            render(
                <FullscreenImageCarousel
                    items={[
                        {
                            src: "https://picsum.photos/id/157/1600/900",
                            fileName: "only-name.jpg",
                        },
                    ]}
                    show={true}
                />
            );

            expect(screen.getByText("only-name.jpg")).toBeInTheDocument();
        });
    });
});

// =============================================================================
// CONSTANTS
// =============================================================================
const IMAGES = [
    { src: "https://picsum.photos/id/157/1600/900" },
    { src: "https://picsum.photos/id/163/900/300" },
    { src: "https://picsum.photos/id/369/1000/1000" },
    { src: "https://picsum.photos/id/445/300/300" },
];

const IMAGES_WITH_FILE_INFO = [
    {
        src: "https://picsum.photos/id/157/1600/900",
        fileName: "photo-a.jpg",
        fileSize: "1.2 MB",
    },
    {
        src: "https://picsum.photos/id/163/900/300",
        fileName: "photo-b.jpg",
        fileSize: "840 KB",
    },
    {
        src: "https://picsum.photos/id/369/1000/1000",
        fileSize: "500 KB",
    },
    { src: "https://picsum.photos/id/445/300/300" },
];
