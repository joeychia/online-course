import { Link } from 'react-router-dom';
import { mockCourses } from '../mockData';

export default function CourseList() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Available Courses</h1>
      
      <div className="space-y-8">
        {mockCourses.map((course) => (
          <div key={course.id} className="border rounded-lg p-6">
            <h2 className="text-2xl font-bold mb-4">{course.name}</h2>
            <p className="text-gray-600 mb-6">{course.description}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.values(course.units).map((unit) => (
                <Link
                  key={unit.id}
                  to={`/courses/${course.id}/units/${unit.id}`}
                  className="block p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h3 className="font-semibold mb-2">{unit.name}</h3>
                  <p className="text-sm text-gray-600">{unit.description}</p>
                  <p className="text-sm text-gray-500 mt-2">
                    {Object.keys(unit.lessons).length} lessons
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 