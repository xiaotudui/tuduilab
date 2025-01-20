import { Link } from 'react-router-dom';

interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
}

interface HomeProps {
  tools: Tool[];
}

export default function Home({ tools }: HomeProps) {
  return (
    <div className='app-container'>
      <div className='tools-grid'>
        {tools.map((tool) => (
          <Link 
            key={tool.id}
            to={tool.path}
            className='tool-card'
          >
            <div className='tool-icon'>{tool.icon}</div>
            <h2 className='tool-title'>{tool.title}</h2>
            <p className='tool-description'>{tool.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
} 