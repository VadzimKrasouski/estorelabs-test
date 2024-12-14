import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import ReactQuill from 'react-quill-new';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { CSS } from "@dnd-kit/utilities";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import CreatableSelect from 'react-select/creatable';
import { Form, Button, Container, Card, ListGroup } from 'react-bootstrap';
import 'react-quill-new/dist/quill.snow.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect, useRef } from 'react';

// Form validation schema
const schema = z.object({
  productTitle: z.string().min(1, 'Product title is required'),
  productDescription: z.string(),
  productBullets: z.array(z.string()),
  keywords: z.array(z.object({ value: z.string(), label: z.string() }))
});

// Categories for the keywords
const categories = [
  { label: 'Electronics', value: 'electronics' },
  { label: 'Clothing', value: 'clothing' },
  { label: 'Home & Kitchen', value: 'home-kitchen' },
  { label: 'Books', value: 'books' },
  { label: 'Toys', value: 'toys' },
  { label: 'Sports', value: 'sports' },
  { label: 'Beauty', value: 'beauty' },
  { label: 'Jewelry', value: 'jewelry' },
  { label: 'Automotive', value: 'automotive' },
  { label: 'Health', value: 'health' },
  { label: 'Pet Supplies', value: 'pet-supplies' },
  { label: 'Office Products', value: 'office' },
  { label: 'Tools', value: 'tools' },
  { label: 'Furniture', value: 'furniture' },
  { label: 'Food & Grocery', value: 'grocery' }
]

type FormData = z.infer<typeof schema>;

// Sortable bullet item component
const SortableBulletItem = ({ 
  id, 
  value, 
  onChange, 
  onRemove 
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onRemove: () => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: isDragging ? transition : undefined,
  };
  
  
  return (
    <ListGroup.Item
      ref={setNodeRef}
      style={style}
      className="d-flex align-items-center"
    >
      <div className="d-flex align-items-center w-100">
        <div
          {...attributes}
          {...listeners}
          className="me-2 cursor-grab"
          style={{ cursor: 'grab' }}
        >
          ⋮⋮
        </div>
        <Form.Control
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="me-2"
        />
        <Button
          variant="danger"
          size="sm"
          onClick={onRemove}
          className="ms-2"
        >
          ✕
        </Button>
      </div>
    </ListGroup.Item>
  );
};

const ProductForm = () => {
  const [bullets, setBullets] = useState<string[]>(['']);
  const quillRef = useRef<ReactQuill>(null);

// Define Quill modules configuration
const modules = {
  toolbar: [
    ['bold', 'italic', 'underline'],    // toggled buttons
    ['clean']                           // remove formatting button
  ]
};

// Define Quill formats
const formats = [
  'bold', 'italic', 'underline'
];

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      productTitle: '',
      productDescription: '',
      productBullets: [''],
      keywords: []
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    setValue('productBullets', bullets);
  }, [bullets, setValue]);

  const handleBulletChange = (index: number, value: string) => {
    const newBullets = [...bullets];
    newBullets[index] = value;
    setBullets(newBullets);
  };

  const addBullet = () => {
    setBullets([...bullets, '']);
  };

  const removeBullet = (index: number) => {
    const newBullets = bullets.filter((_, i) => i !== index);
    setBullets(newBullets);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active.id !== over.id) {
      setBullets((items) => {
        const oldIndex = items.findIndex((_, index) => index.toString() === active.id);
        const newIndex = items.findIndex((_, index) => index.toString() === over.id);
        
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const onSubmit = (data: FormData) => {
    console.log({
      ...data,
      keywords: data.keywords.map(k => k.value)
    });
  };

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Body>
          <Form onSubmit={handleSubmit(onSubmit)}>
            <Form.Group className="mb-4">
              <Form.Label>Product Title</Form.Label>
              <Controller
                name="productTitle"
                control={control}
                render={({ field }) => (
                  <Form.Control {...field} isInvalid={!!errors.productTitle} />
                )}
              />
              {errors.productTitle && (
                <Form.Text className="text-danger">
                  {errors.productTitle.message}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Product Description</Form.Label>
              <Controller
                name="productDescription"
                control={control}
                render={({ field }) => (
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={field.value}
                    onChange={field.onChange}
                    modules={modules}
                    formats={formats}
                    preserveWhitespace
                  />
                )}
              />
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Product Bullets</Form.Label>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={bullets.map((_, index) => index.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <ListGroup className="mb-3">
                    {bullets.map((bullet, index) => (
                      <SortableBulletItem
                        key={index}
                        id={index.toString()}
                        value={bullet}
                        onChange={(value) => handleBulletChange(index, value)}
                        onRemove={() => removeBullet(index)}
                      />
                    ))}
                  </ListGroup>
                </SortableContext>
              </DndContext>
              <Button variant="secondary" onClick={addBullet}>
                Add Bullet Point
              </Button>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Keywords</Form.Label>
              <Controller
                name="keywords"
                control={control}
                render={({ field }) => (
                  <CreatableSelect
                    {...field}
                    options={categories}
                    isMulti
                    placeholder="Type and press enter to add keywords..."
                  />
                )}
              />
            </Form.Group>

            <Button variant="primary" type="submit">
              Submit
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default ProductForm; 