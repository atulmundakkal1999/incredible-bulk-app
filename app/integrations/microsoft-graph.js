import { Client } from '@microsoft/microsoft-graph-client';

class MicrosoftGraphIntegration {
  constructor() {
    this.client = null;
  }

  setAccessToken(accessToken) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  getAuthUrl() {
    const clientId = process.env.MS_CLIENT_ID;
    const redirectUri = process.env.MS_REDIRECT_URI;
    const scopes = [
      'https://graph.microsoft.com/Files.ReadWrite',
      'https://graph.microsoft.com/Sites.ReadWrite.All'
    ].join(' ');

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${clientId}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `response_mode=query`;
  }

  async getToken(code) {
    try {
      const response = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.MS_CLIENT_ID,
          client_secret: process.env.MS_CLIENT_SECRET,
          code: code,
          redirect_uri: process.env.MS_REDIRECT_URI,
          grant_type: 'authorization_code',
        }),
      });

      const tokens = await response.json();
      this.setAccessToken(tokens.access_token);
      return tokens;
    } catch (error) {
      console.error('Error getting Microsoft token:', error);
      throw error;
    }
  }

  async getWorkbook(workbookId) {
    try {
      const workbook = await this.client
        .api(`/me/drive/items/${workbookId}/workbook`)
        .get();
      return workbook;
    } catch (error) {
      console.error('Error getting workbook:', error);
      throw error;
    }
  }

  async getWorksheet(workbookId, worksheetId) {
    try {
      const worksheet = await this.client
        .api(`/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}`)
        .get();
      return worksheet;
    } catch (error) {
      console.error('Error getting worksheet:', error);
      throw error;
    }
  }

  async getRange(workbookId, worksheetId, range) {
    try {
      const rangeData = await this.client
        .api(`/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${range}')`)
        .get();
      return rangeData;
    } catch (error) {
      console.error('Error getting range:', error);
      throw error;
    }
  }

  async updateRange(workbookId, worksheetId, range, values) {
    try {
      const result = await this.client
        .api(`/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${range}')`)
        .patch({
          values: values
        });
      return result;
    } catch (error) {
      console.error('Error updating range:', error);
      throw error;
    }
  }

  async executeOperation(operation, parameters) {
    try {
      const { workbookId, worksheetId, operation_type } = parameters;
      
      switch (operation_type) {
        case 'sort':
          return await this.sortData(workbookId, worksheetId, parameters);
        case 'filter':
          return await this.filterData(workbookId, worksheetId, parameters);
        case 'formula':
          return await this.applyFormula(workbookId, worksheetId, parameters);
        default:
          throw new Error(`Unsupported operation: ${operation_type}`);
      }
    } catch (error) {
      console.error('Error executing operation:', error);
      throw error;
    }
  }

  async sortData(workbookId, worksheetId, parameters) {
    const { range, column, ascending = true } = parameters;
    
    try {
      // Get the range data
      const rangeData = await this.getRange(workbookId, worksheetId, range);
      const values = rangeData.values || [];
      
      if (values.length === 0) {
        return { success: true, message: 'No data to sort' };
      }
      
      // Find the column index
      const headers = values[0];
      const columnIndex = headers.indexOf(column);
      
      if (columnIndex === -1) {
        throw new Error(`Column "${column}" not found`);
      }
      
      // Sort the data (excluding headers)
      const dataRows = values.slice(1);
      dataRows.sort((a, b) => {
        const aVal = a[columnIndex] || '';
        const bVal = b[columnIndex] || '';
        
        if (ascending) {
          return aVal.localeCompare(bVal);
        } else {
          return bVal.localeCompare(aVal);
        }
      });
      
      // Update the range with sorted data
      const sortedValues = [headers, ...dataRows];
      await this.updateRange(workbookId, worksheetId, range, sortedValues);
      
      return {
        success: true,
        message: `Data sorted by ${column} ${ascending ? 'ascending' : 'descending'}`,
        data: sortedValues
      };
    } catch (error) {
      console.error('Error sorting data:', error);
      throw error;
    }
  }

  async filterData(workbookId, worksheetId, parameters) {
    const { range, column, condition, value } = parameters;
    
    try {
      const rangeData = await this.getRange(workbookId, worksheetId, range);
      const values = rangeData.values || [];
      
      if (values.length === 0) {
        return { success: true, message: 'No data to filter' };
      }
      
      const headers = values[0];
      const dataRows = values.slice(1);
      const columnIndex = headers.indexOf(column);
      
      if (columnIndex === -1) {
        throw new Error(`Column "${column}" not found`);
      }
      
      const filteredRows = dataRows.filter(row => {
        const cellValue = row[columnIndex] || '';
        
        switch (condition) {
          case 'equals':
            return cellValue === value;
          case 'contains':
            return cellValue.includes(value);
          case 'greater_than':
            return parseFloat(cellValue) > parseFloat(value);
          case 'less_than':
            return parseFloat(cellValue) < parseFloat(value);
          default:
            return true;
        }
      });
      
      return {
        success: true,
        message: `Filtered data by ${column} ${condition} ${value}`,
        data: [headers, ...filteredRows],
        originalCount: dataRows.length,
        filteredCount: filteredRows.length
      };
    } catch (error) {
      console.error('Error filtering data:', error);
      throw error;
    }
  }

  async applyFormula(workbookId, worksheetId, parameters) {
    const { formula, targetRange } = parameters;
    
    try {
      // For Excel, we can directly set formulas
      const formulaData = [[formula]];
      await this.updateRange(workbookId, worksheetId, targetRange, formulaData);
      
      return {
        success: true,
        message: `Formula applied to ${targetRange}`,
        formula: formula
      };
    } catch (error) {
      console.error('Error applying formula:', error);
      throw error;
    }
  }
}

export default MicrosoftGraphIntegration;
