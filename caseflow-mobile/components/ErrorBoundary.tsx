import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{
          padding: 20,
          backgroundColor: '#111827',
          minHeight: '100vh',
          fontFamily: 'monospace'
        }}>
          <Text style={{ color: '#ef4444', fontSize: 24, fontWeight: 'bold', marginBottom: 16 }}>Something went wrong!</Text>
          <View style={{ marginTop: 20 }}>
            <TouchableOpacity style={{ marginBottom: 10 }}>
              <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Click to see error details</Text>
            </TouchableOpacity>
            <View style={{ backgroundColor: '#1f2937', padding: 10, borderRadius: 4 }}>
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Error:</Text>
              <Text style={{ color: '#fbbf24', fontSize: 14 }}>{this.state.error && this.state.error.toString()}</Text>
              
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>Component Stack:</Text>
              <Text style={{ color: '#60a5fa', fontSize: 12, fontFamily: 'monospace' }}>{this.state.errorInfo && this.state.errorInfo.componentStack}</Text>
              
              <Text style={{ color: '#ffffff', fontSize: 18, fontWeight: 'bold', marginTop: 16, marginBottom: 8 }}>Error Stack:</Text>
              <ScrollView style={{ maxHeight: 200 }}>
                <Text style={{ color: '#f87171', fontSize: 12, fontFamily: 'monospace' }}>{this.state.error && this.state.error.stack}</Text>
              </ScrollView>
            </View>
          </View>
          
          <TouchableOpacity 
            onPress={() => window.location.reload()}
            style={{
              marginTop: 20,
              padding: 10,
              backgroundColor: '#3b82f6',
              borderRadius: 4,
              alignItems: 'center'
            }}
          >
            <Text style={{ color: '#ffffff', fontSize: 16, fontWeight: '600' }}>Reload Page</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
