'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DebugPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:5141/api/posts?page=1&pageSize=20');
        const result = await response.json();
        setData(result);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Posts API Response</h1>
      
      <Card className="mb-4">
        <CardHeader>
          <CardTitle>API Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <p><strong>Total Count:</strong> {data?.totalCount}</p>
          <p><strong>Page:</strong> {data?.page}</p>
          <p><strong>Page Size:</strong> {data?.pageSize}</p>
          <p><strong>Total Pages:</strong> {data?.totalPages}</p>
          <p><strong>Items Found:</strong> {data?.items?.length}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Raw API Response</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
