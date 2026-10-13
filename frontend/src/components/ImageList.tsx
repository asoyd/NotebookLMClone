// ImageList.jsx
// const images = Array.from({ length: 50 }, (_, i) => ({
//   id: i,
//   src: `https://picsum.photos/600/400?random=${i}`,
//   alt: `Image ${i}`,
// }));
const images = [
//   { id: 1, src: '../public/img/notebook-list.png', alt: 'list' },
{ id: 3, src: '../public/img/notebooks.png', alt: 'detail' },
{ id: 2, src: '../public/img/notebook-detail.png', alt: 'detail' },
]
const features = [
//   { id: 4, src: '../public/img/editor.png', alt: 'detail' },
//   { id: 5, src: '../public/img/darkmode.png', alt: 'detail' },
  { id: 6, src: '../public/img/audio-narration1.png', alt: 'detail' },
  { id: 7, src: '../public/img/audio-narration2.png', alt: 'detail' },
  { id: 8, src: '../public/img/flashcard-question.png', alt: 'detail' },
  { id: 9, src: '../public/img/flashcards-answer.png', alt: 'detail' },


];   
<img src="" />
export default function ImageList() {
  return (
    <>
    <style>
        /* ImageList.css */
          {`
    .image-container{
      margin: 10rem 0 2rem 0 ;
      border-top: 1px solid #7574740e;
      }

      .image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  list-style: none;
  padding: 3rem 0 0 0 ;
  width:100%;
  }
  
  h1{
  margin-top:1rem;
  font-weight:700;
  font-size:1.5rem;
  }

.image-item {
  flex: 1 1 300px;   /* min 300px, grow to fill */
  max-width: 500px;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #75747413;
}
.feature-item {
  flex: 1 1 200px;   /* min 300px, grow to fill */
  max-width: 500px;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #75747413;
}
.image-item img {
  width: 100%;
  height: 100%;
 object-fit: contain;
  display: block;
}   
  `}
    </style>
    <div className="image-container">
   <h1>Example Images</h1>
    <ul className="image-list">
   <h2>Editor</h2>

      {images.map(({ id, src, alt }) => (
        <li key={id} className="image-item">
          <img
            src={src}
            alt={alt}
            width={600}
            height={400}
            loading="lazy"
            decoding="async"
          />
        </li>
      ))}
      </ul>
          <ul className="image-list">
               <h2>Features</h2>
           {features.map(({ id, src, alt }) => (
        <li key={id} className="feature-item">
          <img
            src={src}
            alt={alt}
            width={300}
            height={400}
            loading="lazy"
            decoding="async"
          />
        </li>
      ))}
    </ul>
    </div>
     </>
  );
}   